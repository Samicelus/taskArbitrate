const path = require('path');
const mongoose = require('mongoose');

const Task = require('../models/task.js');
const Machine = require('../models/machine.js');

const BaseHandler = require(path.join(__dirname, '../libs/baseHandler.js'));

let handlers = new BaseHandler();

// 当任务完成时调用, 当任务被分配到机器上 Task.times 之后调用
async function onTaskDone(task) {
    console.log(`task: ${task.id} done in: ${task.times} sec, free cpu num for machine: ${task.machineId}`);
    //释放cpu数
    let machineId = task.machineId;
    let machineObj = await Task.schema.findOne({id:machineId}).exec();
    machineObj.freeCpus += 1;
    machineObj.usedCpus -= 1;
    await machineObj.save();
    //再次执行任务分配
    await runSimulation();
}

// 当需要任务开始执行时调用, 返回当前可执行该任务的 Machine, 如没有满足条件的 Machine 则返回 null
async function onTaskSchedule(task){
    let temp_result = null;
    let task_group = task.group;
    let cpus_required = task.cpus;
    //匹配group的结果
    let group_match_condition = {
        group: task_group,
        freeCpus: {"$gte": cpus_required}
    };
    let groupFreeMachines = await Machine.schema.find(group_match_condition).sort({id:1}).exec();
    if(groupFreeMachines.length > 0){
        temp_result = groupFreeMachines[0];
    }else{
        //不匹配group的结果
        let condition = {
            freeCpus: {"$gte": cpus_required}
        };
        let allFreeMachines = await Machine.schema.find(condition).sort({id:1}).exec();
        if(allFreeMachines.length > 0){
            temp_result = allFreeMachines[0];
        }
    }
    if(temp_result != null){
        console.log(`running task: ${task.id} on machine: ${temp_result.id} ...`);
    }
    return temp_result;
}

async function runSimulation() {
    //提取task，并按id排序
    console.log(`getting tasks...`);
    let condition = {
        machineId: {"$exists": false}
    };
    let tasks = await Task.schema.find(condition).sort({id: 1}).exec();
    console.log(`found ${tasks.length} tasks...`);
    await arbitrateSequence(tasks)
}

//递归执行机器分配,直至task全部分配一次
async function arbitrateSequence(tasks){
    if(tasks.length > 0){
        //给task 分配 machine
        let current_task = tasks.shift();
        let machine = await onTaskSchedule(current_task);

        //执行
        if(machine != null){
            machine.freeCpus -= 1;
            machine.usedCpus += 1;
            await machine.save();

            current_task.machineId = machine.id;
            setTimeout(await onTaskDone(current_task), current_task.times*1000);
        }
        await arbitrateSequence(tasks);
    }
}

async function simulateTaskRun(){

}

/**
 * @samicelus 添加测试机器
 **/
handlers.addTestMachines = async function(ctx, next) {
	let request = ctx.request.body;
	let params = {
        machines:   JSON.parse(request.machines)
	};

	console.log(params);
    if (!Array.isArray(params.machines)) {
    	throw new Error(`machines is not an array!`);
    }

    await Machine.schema.insertMany(params.machines);
    handlers.restSuccess(ctx, params.machines);
};

/**
 * @samicelus 添加测试任务
 **/
handlers.addTestTasks = async function(ctx, next) {
    let request = ctx.request.body;
    let params = {
        tasks: JSON.parse(request.tasks)
    };

    console.log(params);
    if (!Array.isArray(params.tasks)) {
        throw new Error(`tasks is not an array!`);
    }

    await Task.schema.insertMany(params.tasks);
    handlers.restSuccess(ctx, params.tasks);
};

/**
 * @samicelus 测试分配任务
 **/
handlers.runTest = async function(ctx, next) {
    await runSimulation();
    handlers.restSuccess(ctx, "done");
};

/**
 * @samicelus 清空测试数据库
 **/
handlers.reset = async function(ctx, next) {
    await Machine.schema.remove({},{"multi":true});
    await Task.schema.remove({},{"multi":true});
    handlers.restSuccess(ctx, "done");
};

module.exports = handlers;