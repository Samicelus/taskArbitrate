const path = require('path');
const mongoose = require('mongoose');
const Task = require('../models/task.js');
const Machine = require('../models/machine.js');
const BaseHandler = require(path.join(__dirname, '../libs/baseHandler.js'));
let handlers = new BaseHandler();

/* 当任务完成时调用, 当任务被分配到机器上 Task.times 之后调用
*
*  释放执行完task对应的机器cpu
*/

async function onTaskDone(task) {
    //console.log(`task: ${task.id} done in: ${task.times} sec, free cpu num for machine: ${task.machineId}`);
    //释放cpu数
    let machineId = task.machineId;
    let machineObj = await Machine.schema.findOne({id:machineId}).exec();
    machineObj.freeCpus += task.cpus;
    machineObj.usedCpus -= task.cpus;
    await machineObj.save();
    //console.log(`machine ${machineObj.id} free cpus num is :${machineObj.freeCpus}`);
}

/* 当需要任务开始执行时调用, 返回当前可执行该任务的 Machine, 如没有满足条件的 Machine 则返回 null
*
*  -->优先寻找group名匹配且有可用cpu的机器，按id从小到大排序
*  -->若无结果则寻找有可用cpu的机器，按id从小到大排序
*  -->若仍无结果则输出 null
*/
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
        //console.log(`running task: ${task.id} on machine: ${temp_result.id} ...`);
    }
    return temp_result;
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
 * @samicelus 测试执行
 **/
handlers.runTest = async function(ctx, next) {
    let logger = [];
    await runSimulation(logger);
    handlers.restSuccess(ctx, logger);
};


async function runSimulation(logger) {
    //提取task，并按id排序
    console.log(`getting tasks...`);
    let condition = {
        machineId: {"$exists": false}
    };
    let tasks = await Task.schema.find(condition).sort({id: 1}).exec();
    logger.push(`found ${tasks.length} tasks...`);
    await arbitrateSequence(tasks, logger)
}

//递归执行机器分配,直至task全部分配一次
async function arbitrateSequence(tasks, logger){
    if(tasks.length > 0){
        //给task 分配 machine
        let current_task = tasks.shift();
        let machine = await onTaskSchedule(current_task);

        //执行
        if(machine != null){
            machine.freeCpus -= current_task.cpus;
            machine.usedCpus += current_task.cpus;
            await machine.save();
            logger.push(`run task ${current_task.id} on machine ${machine.id}, cpu: ${machine.freeCpus}/${machine.cpus}`);
            current_task.machineId = machine.id;
            await current_task.save();
        }else{
            logger.push(`no machine scheduled for task ${current_task.id}`);
        }
        await arbitrateSequence(tasks, logger);
    }else{
        await simulateTaskRun(logger);
    }
}

//模拟任务进行
async function simulateTaskRun(logger){
    //查询分配到的任务
    let condition = {
        machineId: {"$exists": true},
        timeLeft: {"$gt": 0}
    };
    let runnningTasks = await Task.schema.find(condition).sort({timeLeft: 1}).exec();
    if(runnningTasks.length > 0){
        let timeDecrease = runnningTasks[0].timeLeft;

        logger.push(`less time task ${runnningTasks[0].id}, time left: ${timeDecrease} sec ...`)
        let finishCondition = {
            machineId: {"$exists": true},
            timeLeft: timeDecrease
        };
        let finishedTasks = await Task.schema.find(finishCondition).exec();

        //消耗时间
        await Task.schema.update(condition,{"$inc":{"timeLeft":-timeDecrease}}, {"multi":true});
        logger.push(`time passed by ${timeDecrease} sec ...`);

        //触发每个任务完成
        for(let task of finishedTasks){
            logger.push(`task ${task.id} done, free ${task.cpus} cpus for machine ${task.machineId}`);
            await onTaskDone(task);
        }

        //再次执行任务分配
        await runSimulation(logger);
    }else{
        logger.push(`no more task to run, end arbitration`);
    }
}

/**
 * @samicelus 分步测试
 **/
handlers.runTestStep = async function(ctx, next) {
    let logger = [];
    await getTasks(logger);
    await simulateTaskRunOnce(logger);
    handlers.restSuccess(ctx, logger);
};

//模拟一次分配
async function getTasks(logger) {
    //提取task，并按id排序
    let condition = {
        machineId: {"$exists": false}
    };
    let tasks = await Task.schema.find(condition).sort({id: 1}).exec();
    logger.push(`找到 ${tasks.length} 个 任务...`);
    await arbitrateTasks(tasks, logger)
}

//递归执行机器分配,直至task全部分配一次
async function arbitrateTasks(tasks, logger){
    if(tasks.length > 0){
        //给task 分配 machine
        let current_task = tasks.shift();
        let machine = await onTaskSchedule(current_task);

        //执行
        if(machine != null){
            machine.freeCpus -= current_task.cpus;
            machine.usedCpus += current_task.cpus;
            await machine.save();
            logger.push(`在机器:${machine.id} 上执行任务: ${current_task.id},预计耗时 ${current_task.times} 秒, cpu剩余: ${machine.freeCpus}/${machine.cpus}`);
            current_task.machineId = machine.id;
            await current_task.save();
        }else{
            logger.push(`没有可用机器分配给任务: ${current_task.id}`);
        }
        await arbitrateTasks(tasks, logger);
    }
}

//模拟任务进行一次
async function simulateTaskRunOnce(logger){
    //查询分配到的任务
    let condition = {
        machineId: {"$exists": true},
        timeLeft: {"$gt": 0}
    };
    let runnningTasks = await Task.schema.find(condition).sort({timeLeft: 1}).exec();
    if(runnningTasks.length > 0){
        let timeDecrease = runnningTasks[0].timeLeft;
        let finishCondition = {
            machineId: {"$exists": true},
            timeLeft: timeDecrease
        };
        let finishedTasks = await Task.schema.find(finishCondition).exec();

        //消耗时间
        await Task.schema.update(condition,{"$inc":{"timeLeft":-timeDecrease}}, {"multi":true});
        logger.push(`时间过去了 ${timeDecrease} 秒`);

        //触发每个任务完成
        for(let task of finishedTasks){
            logger.push(`任务: ${task.id} 执行完毕, 为 机器: ${task.machineId} 释放了 ${task.cpus} 个 cpu`);
            await onTaskDone(task);
        }
    }else{
        logger.push(`没有可执行的任务，停止模拟`);
    }
}

/**
 * @samicelus 清空测试数据库
 **/
handlers.reset = async function(ctx, next) {
    await Machine.schema.remove({});
    await Task.schema.remove({});
    handlers.restSuccess(ctx, "done");
};

module.exports = handlers;