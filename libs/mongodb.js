const mongoose = require('mongoose');
let mongoConfig = require(process.cwd()+'/config/mongodbConfig.json');
mongoConfig = mongoConfig[process.env.NODE_ENV]||mongoConfig.dev;
let isReconn = false;

let connectStr = 'mongodb://';
if (mongoConfig.replication) {
    if (mongoConfig.user) {
        connectStr += connectStr + mongoConfig.user + ':' + mongoConfig.pwd + '@';
    }
    mongoConfig.servers.forEach((server)=> {
        connectStr += server.host + ':' + server.port + ',';
    });
    connectStr = connectStr.substring(0, connectStr.length - 1);
    connectStr += '/' + mongoConfig.db + '?replicaSet=' + mongoConfig.replication;
} else {
    if (mongoConfig.user) {
        connectStr += mongoConfig.user + ':' + mongoConfig.pwd + '@' + mongoConfig.host + ':' + mongoConfig.port + '/' + mongoConfig.db;
    } else {
        connectStr += mongoConfig.host + ':' + mongoConfig.port + '/' + mongoConfig.db;
    }
}

function connect2db(times) {
    isReconn = true;
    mongoose.connect(connectStr, function (err) {
        if (err) {
            console.error('mongodb连接失败。');
            console.error(connectStr);
            if (times < 1000) {
                setTimeout(function () {
                    connect2db(++times);
                }, 1000);
            }else{
            	throw new Error("重试链接mongodb失败，请检查配置");
            }
        } else {
            console.log('mongodb连接成功。');
            isReconn = false;
            var conn = mongoose.connection;
            conn.on('disconnected', function () {
                console.error('mongodb连接断开，重试中。。。\t');
                if (!isReconn) {
                    connect2db(1);
                }
            });
            conn.on('error', function (e) {
                console.error('mongodb连接失败：\n' + e.stack || e);
                if (!isReconn) {
                    connect2db(1);
                }
            });
        }
    });
}

connect2db(1);

module.exports = mongoose;