const path = require('path');
const handler = require(path.join(__dirname,'../services/taskArbitrateService.js'));

module.exports = (router)=>{
    router.post('/addTestMachines', handler.addTestMachines);
    router.post('/addTestTasks', handler.addTestTasks);
    router.get('/runTest', handler.runTest);
    router.get('/runTestStep', handler.runTestStep);
    router.post('/reset', handler.reset);
};