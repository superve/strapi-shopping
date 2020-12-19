'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */
const _ = require('lodash');
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

// 手机号码正则
const phoneNumberReg = /^1[3-9][0-9]{9}$/;
const { formatError } = require('../../../utils/errors');

/**
 * Throws an ApolloError if context body contains a bad request
 * @param contextBody - body of the context object given to the resolver
 * @throws ApolloError if the body is a bad request
 */
function checkBadRequest(contextBody) {
    if (_.get(contextBody, 'statusCode', 200) !== 200) {
      const message = _.get(contextBody, 'error', 'Bad Request');
      const exception = new Error(message);
      exception.code = _.get(contextBody, 'statusCode', 400);
      exception.data = contextBody;
      return exception;
    }
}

module.exports = {

    /**
     * @description 手机用户注册，代理用户插件注册（非入侵式），主要负责验证手机验证码
     * @param {*} ctx 
     */
    async register(ctx) {
        const params = ctx.request.body;

        // 验证手机号码
        if(phoneNumberReg.test(params.username) === false) {
            return ctx.badRequest(
                null,
                formatError({
                    id: "Auth.form.error.username",
                    message: "Username(phone number) is not found or formart error"
                })
            )
        }

        // 此处手机验证码
        if(params.verify_code !== "123456") {
            return ctx.badRequest(
                null,
                formatError({
                    id: "Auth.form.error.verify_code",
                    message: "Verify_code invalid"
                })
            )
        }

        // 验证密码 （参考错误统一说明），密码具体格式由用户插件系统去判断
        if(!params.password) {
            return ctx.badRequest(
                null,
                formatError({
                    id: 'Auth.form.error.password.provide',
                    message: 'Please provide your password.',
                })
            )
        }

        // 删除验证码属性，非用户插件系统字段
        const paramsProps = _.omit(params, "verify_code");
        ctx.request.body = {
            ...paramsProps,
            email: `${params.username}@example.com`
        };

        // 调用用户插件注册方法
        await strapi.plugins['users-permissions'].controllers.auth.register(ctx);
        let output = ctx.body.toJSON ? ctx.body.toJSON() : ctx.body;

        // 错误处理
        const exception = checkBadRequest(output);
        if (exception) {
            return exception;
        }

        return {
            user: output.user || output,
            jwt: output.jwt,
        };
    },

    /**
     * @description 手机用户登录
     * @param {*} ctx 
     */
    async login(ctx) {
        const params = ctx.request.body;

        // 验证手机号码
        if(!params.username) {
            return ctx.badRequest(
                null,
                formatError({
                    id: "Auth.form.error.username",
                    message: "Please provide your username."
                })
            )
        }

        // 根据用户名查找用户
        const user = await strapi
            .query("user", "users-permissions").findOne({
                username: params.username,
            });;
        if (!user){
            return ctx.badRequest(
                null,
                formatError({
                    id: "Auth.form.error.invalid",
                    message: "username invalid."
                })
            )
        }

        // 密码登录
        if(params.password) {
            const validPassword = await strapi.plugins[
                'users-permissions'
            ].services.user.validatePassword(params.password, user.password);

            if(!validPassword){
                return ctx.badRequest(
                    null,
                    formatError({
                        id: 'Auth.form.error.invalid',
                        message: 'uername or password invalid.',
                    })
                )
            }
        }

        // 手机验证码登录
        if (params.verify_code) {
            if(params.verify_code !== "123456") {
                return ctx.badRequest(
                    null,
                    formatError({
                        id: "Auth.form.error.verify_code",
                        message: "Verify_code invalid."
                    })
                )
            }
        }

        ctx.send({
            jwt: strapi.plugins['users-permissions'].services.jwt.issue({
              id: user.id,
            }),
            user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
              model: strapi.query('user', 'users-permissions').model,
            }),
        });
    },

    /**
     * @description 编辑用户信息, 代理user.update, 手机用户名必须要验证才可修改
     *              可以修改密码，需要验证新旧密码需要提供独立方法
     * @param {*} ctx 
     */
    async update(ctx) {
        const params = ctx.request.body;

        // 修改用户名（手机号码）
        if( params.username ) {
            if( params.verify_code !== "123456" ) {
                return ctx.badRequest(
                    null,
                    formatError({
                        id: "Auth.form.error.verify_code",
                        message: "Verify_code invalid."
                    })
                )
            }
            delete params.verify_code;
        }

        // 修改非用户名字段无需判断
        await strapi.plugins['users-permissions'].controllers.user.update(ctx);
        return {
            user: ctx.body.toJSON ? ctx.body.toJSON() : ctx.body
        }
    },

    /**
     * @description 重置密码
     * @param {*} ctx 
     */
    async resetPassword(ctx) {
        const params = _.assign({}, ctx.request.body, ctx.params);

        if( 
            params.password &&
            params.passwordConfirmation &&
            params.password === params.passwordConfirmation 
        ){
            // 密码hash加密
            const password = await strapi
                .plugins['users-permissions']
                .services.user.hashPassword({
                    password: params.password,
                });

            // 修改密码
            const user = ctx.state.user;
            await strapi
                .query('user', 'users-permissions')
                .update(
                    { id: user.id }, 
                    { resetPasswordToken: null, password }
                );

            ctx.send({
                jwt: strapi.plugins['users-permissions'].services.jwt.issue({
                    id: user.id,
                }),
                user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
                    model: strapi.query('user', 'users-permissions').model,
                }),
            });
        } else if (
            params.password &&
            params.passwordConfirmation &&
            params.password !== params.passwordConfirmation
        ) {
            return ctx.badRequest(
                null,
                formatError({
                    id: 'Auth.form.error.password.matching',
                    message: 'Passwords do not match.',
                })
            );
        } else {
            return ctx.badRequest(
                null,
                formatError({
                    id: 'Auth.form.error.params.provide',
                    message: 'Incorrect params provided.',
                })
            );
        }
    },

    /**
     * @description 检查登录
     * @param {*} ctx 
     */
    async checkLogin( ctx ) {

        ctx.send({
            data: !!ctx.state.user
        })
    }
};
