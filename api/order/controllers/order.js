'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    /**
     * @description 创建订单
     */
    async create( ctx ) {
        const params = ctx.request.body;

        // 第一个作为默认值
        const defaultType = await strapi.services['order-types'].findOne({id: 1});
        params.order_type = defaultType;
        params.out_trade_no = "ATL" + Date.now();
        const entity = await strapi.services.order.create(params);
        return sanitizeEntity(entity, { model: strapi.models.order });
    }
};
