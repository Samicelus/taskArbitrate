class BaseHandler{
    constructor(){

    }

    restSuccess(ctx, ret){
        ctx.response.type = 'json';
        ctx.response.body = {
            result: true,
            data: ret
        };
    }

    restError(ctx, error_code, error_message){
        ctx.response.type = 'json';
        ctx.response.body = {
            result: false,
            error_code: error_code,
            error_message: error_message
        };
    }
}

module.exports = BaseHandler;