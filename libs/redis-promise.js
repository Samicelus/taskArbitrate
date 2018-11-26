const redis = require('redis');
const Promise = require('bluebird');
Promise.promisifyAll(redis);

const redisConfig = require(process.cwd()+'/config/redisConfig.json')[process.env.NODE_ENV];
const redisClient = redis.createClient(redisConfig.port, redisConfig.host);

module.exports = {
    redisClient: redisClient
};