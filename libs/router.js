const path = require('path');
const fs = require('fs');
const route_files = fs.readdirSync(path.join(__dirname, '../routes'), 'utf8');
const Router = require('koa-router');
let router = new Router();

module.exports = function(app){
    route_files.forEach((filename)=>{
        console.log(`import: ${filename} ...`);
        require(path.join(__dirname,'../routes','/',filename))(router);
    })
    app.use(router.routes());
}