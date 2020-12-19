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
     * @description 查找购物车
     */
    async find(ctx) {
        const user = ctx.state.user;
        if(!user) {
            return ctx.badRequest(  
                null,
                formatError({
                    id: "Cart.error.create",
                    message: "user is invalid."
                })
            )
        }

        let entity = await strapi.services.cart.findOne({ 
            users_permissions_user: user.id 
        });

        // 给sku商品加上数量和商品返回，（复制于update，可封装）
        for(let i = 0, sku; sku = entity.skus[i++];) {
            // 当前sku商品数量和选中状态
            cart.counts_map.forEach(v => {
                if(v.sku_id === sku.id) {
                    sku.count = v.count;
                    sku.selected = v.selected;
                }
            })
            
            //  给购物车sku商品获取详细的商品数据
            sku.goods_detail = await strapi.services.goods.findOne({id: sku.goods});
            sku.goods_detail = _.omit(sku.goods_detail, ["categories", "skus", "comments",]);
        }
        
        delete entity.counts_map;
        return sanitizeEntity(entity, { model: strapi.models.cart });
    },

    /**
     * @description 创建购物车，一个用户对应一个购物车
     */
    async checkCart(ctx) {
        const user = ctx.state.user;

        if(!user) {
            return ctx.badRequest(  
                null,
                formatError({
                    id: "Cart.error.create",
                    message: "user is invalid."
                })
            )
        }

        // 查找购物车
        let cart = await strapi.services.cart.findOne({ 
            users_permissions_user: user.id 
        });
        if (!cart) {
            cart = await strapi.services.cart.create({
                users_permissions_user: user,
                counts_map: []
            });
        }

        return cart;
    },

    /**
     * @description 更新购物车数据
     * @param {*} ctx 
     */
    async update(ctx) {
        const params = ctx.request.body;
        if(!Array.isArray(params)){
            return ctx.badRequest(
                null,
                formatError({
                    id: "Cart.format.error.update",
                    message: "params must be an array."
                })
            )
        }

        // 检查购物车是否存在
        const cart = await this.checkCart(ctx);
        for(let i = 0, item; item = params[i++];) {
            // 判断sku是否有效
            const sku = await strapi.services.sku.findOne({id: item.sku_id});
            if(!sku) {
                return ctx.badRequest(
                    null,
                    formatError({
                        id: "Cart.error.update",
                        message: "sku_id is invalid."
                    })
                )
            }

            // 循环购物车sku查看是否包含了该商品
            let isExist = cart.skus.some(sku => {
                return sku.id === item.sku_id;
            });

            // 如果包含了则数量增加否则新增
            if(isExist) {
                // cart.counts_map 的初始值为空数组
                cart.counts_map.forEach(v => {
                    if(v.sku_id === item.sku_id) {
                        v.count += item.count;
                        v.selected = item.selected;
                    }
                })
            } else {
                // 添加当前sku商品到购物车
                cart.skus.push(item.sku_id);
                // 更新sku商品数量，不过该数量不会返回到前端
                cart.counts_map.push(item);
            }
        }

        // 更新购物车数据
        const entity = await strapi.services.cart.update({ id: cart.id }, cart);

        // 给sku商品加上数量和商品返回
        for(let i = 0, sku; sku = entity.skus[i++];) {
            // 当前sku商品数量和选中状态
            cart.counts_map.forEach(v => {
                if(v.sku_id === sku.id) {
                    sku.count = v.count;
                    sku.selected = v.selected;
                }
            })
            
            //  给购物车sku商品获取详细的商品数据
            sku.goods_detail = await strapi.services.goods.findOne({id: sku.goods});
            sku.goods_detail = _.omit(sku.goods_detail, ["categories", "skus", "comments"]);
        }
        
        delete entity.counts_map;
        return sanitizeEntity(entity, { model: strapi.models.cart });
    }
};
