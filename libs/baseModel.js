'use strict';
const mongoose = require("./mongodb.js");
class BaseModel{
    constructor() {
        this.mongoose = mongoose;
        this.Schema = this.mongoose.Schema;
        this.ObjectId = this.Schema.ObjectId;
    };
}
module.exports = BaseModel;