module.exports = ({ env }) => ({
    email: {
        provider: 'smtp',
        providerOptions: {
            host: 'smtp.qq.com', //SMTP Host
            port: 465   , //SMTP Port
            secure: true,
            username: '407775611@qq.com',
            password: 'gxaeqrxlaoakcafa',
            rejectUnauthorized: true,
            requireTLS: true,
            connectionTimeout: 1,
        },
        settings: {
            from: '407775611@qq.com',
            replyTo: '407775611@qq.com',
        },
    },
});