# taskArbitrate
an interview question

main functions are in services/taskArbitrateServices.js

line 9

line 21


# Install

```
git clone https://github.com/Samicelus/taskArbitrate.git
cd taskArbitrate
npm install
```

# Start Server

- run mongodb on port 27017

- run redis on 6379

- install pm2

- config process.json for logger path

```
pm2 start process.json
```

This server provides 5 RESTful APIs for testing:

- add machine data to database:

[POST]  your server ip:3000/addTestMachines

- add task data to database:

[POST]  your server ip:3000/addTestTasks

- run simulation and output logs:

[GET]  your server ip:3000/runTest
  
- run simulation step by step, and output chinese logs:

[GET] your server ip:3000/runTestStep
  
- remove test data, must run everytime before each test:

[POST] your server ip:3000/reset
  
see params examples of APIs description or test on my server by importing POSTMAN collection link below:

https://www.getpostman.com/collections/c99c8cc6f96efc52d59f

