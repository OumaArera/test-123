const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const User = require('./user')(sequelize, Sequelize);
const AccountStructure = require('./accountStructure')(sequelize, Sequelize);
const TransactionDetails = require('./transactionsDetails')(sequelize, Sequelize);
const Cryptomus = require("./Cryptomus")(sequelize, Sequelize);
const Orders = require("./orders")(sequelize, Sequelize);
const SubUsers = require("./subUser")(sequelize, Sequelize);

const db = {
  sequelize,
  Sequelize,
  User,
  AccountStructure,
  TransactionDetails,
  Cryptomus,
  Orders,
  SubUsers
};

// Define associations
User.associate(db);
AccountStructure.associate(db);
TransactionDetails.associate(db);
Cryptomus.associate(db);
Orders.associate(db);
SubUsers.associate(db);

module.exports = db;
