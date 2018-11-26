const fs = require('fs');
const crypto = require('crypto');
const moment = require(`moment`);
const superagent = require('superagent');
const _ = require('lodash');


class Utils{
    constructor(){

    }

    dateFormat(date){
        let res = moment(date).format('YYYY-MM-DD');
        return res == 'Invalid date' ? '' : res;
    }

    datetimeFormat(time){
        let res = moment(time).format('YYYY-MM-DD HH:mm:ss');
        return res == 'Invalid date' ? '' : res;
    }

    addDays(time, day) {
        let res = moment(time).add(day,"days");
        return res == 'Invalid date' ? '' : res;
    }

    addMinutes(time, minute){
        let res = moment(time).add(minute,"minutes");
        return res == 'Invalid date' ? '' : res;
    }

    addDaysYMD(time, day) {
        let res = moment(time).add(day,"days").format('YYYY-MM-DD');
        return res == 'Invalid date' ? '' : res;
    }

    nMonthDay() {
        let res = moment().format('YYYY-MM-01');
        return res == 'Invalid date' ? '' : res;
    }

    nDayBefore(n){
        let res = moment().subtract(n, "days").format('YYYY-MM-DD HH:mm:ss');
        return res == 'Invalid date' ? '' : res;
    }

    nMinuteBefore(n){
        let res = moment().subtract(n, "minutes").format('YYYY-MM-DD HH:mm:ss');
        return res == 'Invalid date' ? '' : res;
    }

    form_id_expire(date){
        let res = moment(date).add(7, 'days').format('YYYY-MM-DD');
        return res == 'Invalid date' ? '' : res;
    }

    async request(option){
        let method = option.method.toLowerCase();
        let request_obj = superagent[method](option.url);
        if(method == "post"){
            request_obj.send(option.data);
        }
        switch(option.type){
            case "form":
                //作为form-data表单提交，在superagent中，直接set("Content-Type","multipart/form-data")会报错
                request_obj.type('form');
                break;
            default:
                break;
        }
        if(option.header){
            for(let key in option.header){
                request_obj.set(key, option.header[key].toString());
            }
        }
        let result = await request_obj;
        if(result.statusCode === 200){
            // console.log(result.text);
            try{
                return JSON.parse(result.text);
            }catch(e){
                return result.body;
            }
        }else{
            throw new Error(`bad request code: ${result.statusCode}`)
        }
    }

    async sendTexto(code, phone){
        let sdkappid = 1400097643;
        let appkey = "d31134c52910cfdfcbbdbde7f21b831b";
        let time = Math.round(new Date().getTime()/1000);
        let str = `appkey=${appkey}&random=${code}&time=${time}&mobile=${phone}`;
        let sig = this.sha256(str);
        let data = {
            params:[code, 1],
            sig:sig,
            sign:"云医管家服务",
            tel:{
                mobile:phone,
                nationcode:"86"
            },
            time:time,
            tpl_id:128824
        };
        return await this.request({
            url: "https://yun.tim.qq.com/v5/tlssmssvr/sendsms?sdkappid="+sdkappid+"&random="+code,
            method: "post",
            data:data
        });
    }

    generateId(str){
        let random = Math.floor(Math.random()*10000+1);
        let timestamp = new Date().getTime();
        let combined = random + "_" + str + "_" + timestamp;
        return this.md5(combined);
    }

    md5(str) {
        return crypto.createHash('md5').update(str, 'utf-8').digest('hex');
    }

    sha256(str) {
        return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
    }

    zeroPad(digits, n) {
        n = n.toString();
        while (n.length < digits) {
            n = `0${n}`;
        }
        return n;
    }

    zeroPadStart(digits, n){
        return _.padStart(n.toString().trim(), digits, "0");
    }

    zeroPadEnd(digits, n){
        return _.padEnd(n.toString().trim(), digits, "0");
    }

    // @ronWang 数组去重
    arrayUnique(arr) {
        return Array.from(new Set(arr));
    }

    // mongodb 中 select 字符串转换成 project
    mongodbSelectToProject(str, header="") {
        let strArr = str.replace(/^\s+|\s+$/g," ").split(" ");
        let project = {};
        strArr.forEach((item) => {
            project[header + item] = 1;
        });
        return project;
    }

    /**
     * @felix 前端入参数据校验
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    validator(data) {
        if (data.constructor !== Object) {
            throw new Error("data type error");
        }

    }
}

module.exports = new Utils();
