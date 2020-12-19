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
     * @param   order<Number>
     * @param   sku<Number>
     * @param   content<String>
     * @param   comment_media<Array>
     * @param   parent_comment?<Number>
     */             
    async create(ctx) {
        const params = ctx.request.body;
        const user = ctx.state.user;
        const saveData = {...params, user};

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

        // 查找sku
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

        // 二级评论
        let parentComment;
        if(params.parent_comment) {
            parentComment = await strapi.services.comment.findOne({ 
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
        }

        const entity = await strapi.services.comment.create(saveData);
        // 修改父评论
        if(parentComment){
            parentComment.children_comments.push(entity.id);
            await strapi.services.comment.update(
                { id: parentComment.id }, 
                {children_comments: parentComment.children_comments}
            );
        }
        return sanitizeEntity(entity, { model: strapi.models.comment });
    }
};
