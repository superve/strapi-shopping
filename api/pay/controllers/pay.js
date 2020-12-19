'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const fs = require("fs");
const AlipaySdk = require('alipay-sdk').default;
//import { sign } from 'alipay-sdk/lib/util'
// const util = require("alipay-sdk/lib/util");
const path = require("path");
const AlipayFormData = require("alipay-sdk/lib/form").default;

const alipaySdk = new AlipaySdk({
    appId: "2021000116671630",
    privateKey: fs.readFileSync(path.resolve(__dirname, "../config/RSA/private-key.pem"), 'ascii'),
    // alipayPublicKey: fs.readFileSync(path.resolve(__dirname, "../config/RSA/public-key.pem"), 'ascii'),
    gateway: "https://openapi.alipaydev.com/gateway.do"
});

module.exports = {
    /**
     * @description 创建订单成功后，根据订单编号支付，支付函数
     */
    async payment(ctx) {
        return 123;
    },

    /**
     * @description 支付宝支付链接
     */
    async alipayPay(ctx) {
        const params = ctx.query;

        // App或小程序支付方式
        // const data = util.sign('alipay.trade.page.pay', {
        //     notifyUrl: 'http://127.0.0.1:1337/admin',
        //     bizContent: {
        //         subject: 'goods titles',
        //         totalAmount: '0.01',
        //         outTradeNo: '000',
        //         productCode: 'QUICK_MSECURITY_PAY',
        //     },
        // }, alipaySdk.config)
        // const payInfo = new URLSearchParams(data).toString()

        // PC支付方式
        const formData = new AlipayFormData();
        formData.setMethod('get');
        formData.addField('notifyUrl', params.notifyUrl || 'http://127.0.0.1:1337/admin');
        formData.addField('bizContent', {
            outTradeNo: params.outTradeNo,
            productCode: 'FAST_INSTANT_TRADE_PAY',
            totalAmount: Number(params.totalAmount).toFixed(2),
            subject: params.subject,
            body: params.body,
        });

        const result = await alipaySdk.exec(
            'alipay.trade.page.pay',
            {},
            { formData: formData },
        );

        return result;
    },

    /**
     * @description 支付宝交易查询支付结果
     */
    async alipayQuery(ctx) {
        const params = ctx.query;
        const result = await alipaySdk.exec(
            'alipay.trade.query', 
            {
                bizContent: {
                    outTradeNo: params.outTradeNo
                }
            }
        )
        return result;
    },

    /**
     * @description 支付宝异步接收订单支付结果,
     *              注意：该方式的调试与运行必须在服务器上，即互联网上能访问
     *              解决办法：在前端页面中弹出询问支付结果蒙层弹窗，关闭窗口事发起查询订单支付结果
     */
    async alipayNotify() {

    },

    /**
     * @description 支付宝退款申请
     *              退款接口应该由发起退款申请，商户主动操作退款
     */
    async alipayRefund(ctx) {
        const outRequestNo = Date.now();
        const params = ctx.query;
        const result = await alipaySdk.exec(
            'alipay.trade.refund',
            {
                bizContent: {
                    outTradeNo: params.outTradeNo,
                    // 退款金额
                    refundAmount: Number(params.refundAmount).toFixed(2), 
                    // 支持部分退款 (同一笔交易多次退款需要保证唯一)
                    outRequestNo
                }
            }
        )
        return {
            ...result,
            outRequestNo
        };
    },
    
    /**
     * @description 支付宝退款状态查询
     *              注意：只要退款申请成功，则表示退款是支付宝和支付方的纠纷，和商户无关，
     *                   该接口主要处理退款接口由于网络等原因返回异常，查询指定交易的退款信息。
     */
    async alipayRefundQuery(ctx) {
        const params = ctx.query;
        const result = await alipaySdk.exec(
            'alipay.trade.fastpay.refund.query',
            {
                bizContent: {
                    outTradeNo: params.outTradeNo,
                    // 支持部分退款 (同一笔交易多次退款需要保证唯一)
                    outRequestNo: params.outRequestNo
                }
            }
        )
        return result;
    }
};
