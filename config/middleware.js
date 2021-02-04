module.exports = ({ env }) => {
    return {
        settings: {
            // 上传文件时候跨域问题
            cors: { enabled: true, headers: '*' }
        },
    }

};