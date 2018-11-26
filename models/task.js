let BaseModel = require('../libs/baseModel.js');
let model  = new BaseModel();

let _Schema = new model.Schema({
    id: {type: Number, unique: true},        	// 任务 id, 不会重复
    group: {type: String, required:true},    	// 任务分组标签(字符串, 不会为空)
											    // 某个分组的任务只会分配给分组相同的 Machine 或者分组为空字符串的 Machine
    cpus: {type: Number, default:1, enum:[1]},  // 任务需求的 cpu 数量, 固定为 1
    times: {type: Number},     					// 任务处理所需时长(秒), 必定大于 0
    timeLeft: {type: Number},                   // 任务处理剩余时长
    machineId: {type: Number}  					// 被分配给的 Machine Id, 当被分配后该值有意义
}, {versionKey: false});

model.schema =  model.mongoose.model('tasks', _Schema);

module.exports = model;