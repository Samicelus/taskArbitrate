const redis = require('redis-await');
// const Promise = require('bluebird');
// Promise.promisifyAll(redis);

const redisConfig = require(process.cwd()+'/config/redisConfig.json')[process.env.NODE_ENV];
const redisClient = new redis({port: redisConfig.port,host: redisConfig.host});

module.exports = redisClient;