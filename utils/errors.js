
module.exports = {
    // 统一错误格式 （统一说明，若有其他判断可以证明字段合法性，则忽略判断该字段是否为空，如注册验证手机号码）
    formatError(error){
        return [{ 
            messages: [
                { id: error.id, message: error.message, field: error.field},
            ] 
        }]
    }
}