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
     * @description 创建评论
     *              1.订单必须存在， sku必须存在，新增一级评论前当前订单必须无评论
     *              2.类型：普通、追加 | 管理员回复
     *              3.管理员评论发送通知邮件，邮箱必须通过验证的
     *              注意：一份订单可能有多个SKU，所以发布评论是针对多个SKU循环创建多个的，
     *                  但是管理再回复时是针对单个商品 SKU回复，针对订单评论，商品回复
     * @param   order<Number>
     * @param   sku<Number>
     * @param   content<String>
     * @param   comment_media<Array>
     * @param   parent_comment?<Number>
     */             
    async create(ctx) {
        const params = ctx.request.body;
        const user = ctx.state.user;
        const result = [];

        if(!params.content && !params.comment_media) {
            ctx.badRequest(
                null,
                formatError({
                    id: "Comment.form.error.create",
                    message: "content or comment_media is invalid."
                })
            )
        }

        // 查找订单
        const order = await strapi.services.order.findOne({ 
            id: params.order, 
            user: user.id 
        });
        if(!order) {
            ctx.badRequest(
                null,
                formatError({
                    id: "Comment.form.error.create",
                    message: "order id is invalid."
                })
            )
        }
        
        // 最终发布的数据
        const saveData = {...params, user};

        if( !params.parent_comment ) {
            // 查找sku, 如果一份订单有多个sku，需要循环创建多次
            for(let i = 0, item; item = order.skuses[i++];) {
                const sku = await strapi.services.sku.findOne({ id: item.id });
                if(!sku) {
                    ctx.badRequest(
                        null,
                        formatError({
                            id: "Comment.form.error.create",
                            message: "sku id is invalid."
                        })
                    )
                }
                saveData.sku = sku;
                saveData.goods = sku.goods;

                // 新增一级评论前当前订单必须无评论
                if(order.comments && order.comments.length > 0 && !params.parent_comment) {
                    ctx.badRequest(
                        null,
                        formatError({
                            id: "Comment.form.error.create",
                            message: "order aleady comment."
                        })
                    )
                }      

                const entity = await strapi.services.comment.create(saveData);
                result.push(sanitizeEntity(entity, { model: strapi.models.comment }));
            } 
        } else {
            // 二级评论, 针对单条SKU回复，
            let parentComment = await strapi.services.comment.findOne({ 
                id: params.parent_comment 
            });
            if(!parentComment || parentComment.level !== 1){
                ctx.badRequest(
                    null,
                    formatError({
                        id: "Comment.form.error.create",
                        message: "parent comment id is invalid."
                    })
                )
            }
            saveData.level = 2;

            //  针对单条SKU回复，
            const sku = await strapi.services.sku.findOne({ id: params.sku });
            if(!sku) {
                ctx.badRequest(
                    null,
                    formatError({
                        id: "Comment.form.error.create",
                        message: "sku id is invalid."
                    })
                )
            }
            saveData.sku = sku;
            saveData.goods = sku.goods;

            // 修改父评论
            const entity = await strapi.services.comment.create(saveData);
            parentComment.children_comments.push(entity.id);
            await strapi.services.comment.update(
                { id: parentComment.id }, 
                {children_comments: parentComment.children_comments}
            );
           
            result.push(sanitizeEntity(entity, { model: strapi.models.comment }));
        }

        return result;
    }
};
