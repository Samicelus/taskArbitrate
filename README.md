# taskArbitrate
an interview question

main functions are in services/taskArbitrateServices.js

line 9 
line 21


# Install

$ git clone https://github.com/Samicelus/taskArbitrate.git
$ cd taskArbitrate
$ npm install

# Start Server

-run mongodb on port 27017
-run redis on 6379
-install pm2
-config process.json for logger path

$pm2 start process.json

This programe provide 5 RESTful APIs for test

1. add machine data to database:
[POST] <server ip>:3000/addTestMachines

2. add task data to database:
[POST] <server ip>:3000/addTestTasks

3. run simulation and output logs:
[GET] <server ip>:3000/runTest
  
4. run simulation step by step, and output chinese logs:
[GET]<server ip>:3000/runTestStep
  
5. remove test data, must run everytime before each test:
[POST] <server ip>:3000/reset
  
see param examples of APIs description or test on my server by import POSTMAN link below:
https://www.getpostman.com/collections/c99c8cc6f96efc52d59f

