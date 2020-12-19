'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    /**
     * @description 创建商品
     * @param {*} ctx 
     */
    async create( ctx ) {
        // 获取出skus
        const {skus, ...params} = ctx.request.body;

        /*
            skus 格式, colors是type name
            {
            "skus": [
                { "type_1": "black", "type_2": "s", "type_3": "guohang", "type_1_name": "colors", "type_2_name": "sizes", "type_3_name": "country" },
                { "type_1": "black", "type_2": "m", "type_3": "guohang", "type_1_name": "colors", "type_2_name": "sizes", "type_3_name": "country"  },
                { "type_1": "black", "type_2": "L", "type_3": "guohang", "type_1_name": "colors", "type_2_name": "sizes", "type_3_name": "country"  },
            ]
            }
        */
        const goods = await strapi.services.goods.create(params);

        // 循环创建 skus
        skus.forEach(async sku => {
            sku["goods"] = goods.id;
            await strapi.services.sku.create(sku);
        })

        const entity = await strapi.services.goods.find({id: goods.id});
        return sanitizeEntity(entity, { model: strapi.models.goods });
    }
};
