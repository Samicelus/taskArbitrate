let BaseModel = require('../libs/baseModel.js');
let model  = new BaseModel();

let _Schema = new model.Schema({
    cpus: {type: Number},       						// CPU 数量
    usedCpus: {type: Number},   						// 当前使用中的 CPU 数量
    freeCpus: {type: Number},   						// 当前剩余的 CPU 数量
    id: {type: Number, unique: true},   				// 机器 id, 不会重复
    group: {type: String, required:false}				// 机器分组标签(字符串, 可为空)
														// 当该属性为空字符串时代表可以执行任意分组的任务,
														// 不为空时则只能执行该分组的任务.
}, {versionKey: false});

model.schema =  model.mongoose.model('machines', _Schema);

module.exports = model;