'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');
const { formatError } = require('../../../utils/errors');

module.exports = {
    /**
     * @description 查找栏目，原find方法无法满足子栏目条件，比如blocked=true对子栏目无效
     * @param {*} ctx 
     */
    async find( ctx ){
        
        const entities = await strapi.services.category.find(ctx.query);
        const result = entities.map(entity => {
            const category = sanitizeEntity(entity, { model: strapi.models.category })
            return _.omit(category, ["goods"]);
        });

        async function loop(children){
            if(children && Array.isArray(children)) {
                //for(let i = 0, item; item = children[i++];) {
                for(let item of children){
                    const id = item.id;
                    const current = await strapi.services.category.findOne({id}); // blocked: true

                    item.children_categories = current.children_categories || [];
                    await loop(item.children_categories)
                }
            }   
        }

        if(result && Array.isArray(result)) {
            for(let item of result){
                await loop(item.children_categories);
            }
        }

        return result;
        
        // const knex = strapi.connections.default;
        // const result = await knex('categories as a')
        //     .join('categories as b', function(){
        //         this.on('b.parent_category', '=', 'a.id')
        //     })
        //     .where({
        //         'a.blocked': true,
        //         'b.level': 1
        //     })
        //     .select('*')

        // return result;   
    },

    /**
     * @description 创建栏目
     * @param {*} ctx 
     */
    async create( ctx ) {
        const params = ctx.request.body;
        
        // 验证栏目名
        if ( !params.category_name ) {
            ctx.badRequest(
                null,
                formatError({
                    id: "Category.form.error.category",
                    message: "category name invalid."
                })
            )
        }

        // 如果有父评论
        if ( params.parent_category ) {
            const parent = await strapi.services.category.findOne({
                id: params.parent_category
            })

            if ( !parent ) {
                ctx.badRequest(
                    null,
                    formatError({
                        id: "Category.form.error.category",
                        message: "parent category id invald."
                    })
                )
            }

            // 栏目等级，1是最顶级
            params.level = Number(parent.level) + 1;
        }

        const entity =  await strapi.services.category.create(params)
        return sanitizeEntity(entity, { model: strapi.models.category });
    }
};
