const { Sequelize } = require('sequelize');
require('dotenv').config();
const { development } = require("./config");
const sequelize = new Sequelize(development);

module.exports = sequelize;