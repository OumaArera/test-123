const express = require('express');
const db = require('./models');
const signupRoute = require('./authenticate/signup');
const signinRoute = require('./authenticate/signin');
const usersRoute = require('./users/users');
const removeUsers = require("./users/remove")
const postAccount = require("./accountStructure/postAccount");
const getAccount = require("./accountStructure/getAccount");
const updateDataCentreID = require("./accountStructure/updateDatacentreProxies");
const updateProxiesID = require("./accountStructure/updateResidentialProxies");
const mpesaStkPush = require("./payments/mpesa");
const getMpesaTransactions = require("./payments/getTransaction");
const cryptoMus = require("./payments/cryptomus");
const webhook = require("./payments/cryptomusWebhook");
const getWebhook = require("./payments/getCryptomusTransactions");
const postProxy = require("./proxy/spaceproxy");
const getPrices = require("./proxy/residentialPricing");
const eliteProxy = require("./proxy/eliteProxy")
const orderProxy = require("./proxy/orderProxy");
const createSubUser = require("./subUser/createSubUser");
const updateSubUserUsername = require("./subUser/updateUsername");
const updateSubUserPassword = require("./subUser/updatePassword");
const addTraffic = require("./proxy/orderElite");
const createOrder = require("./proxy/orderResidential");
const forgotPassword = require("./authenticate/forgotPassword");
const payReferees = require("./payments/payReferees");
const cors = require('cors'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Use CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());

// Define routes
app.use('/users/signup', signupRoute);
app.use('/users/login', signinRoute);
app.use('/users', usersRoute);
app.use("/users/remove", removeUsers);
app.use("/users/account", postAccount);
app.use("/users/account", getAccount);
app.use("/users/update-proxy", updateProxiesID);
app.use("/users/update-datacentre", updateDataCentreID);
app.use("/users/mpesa", mpesaStkPush)
app.use("/users/mpesa", getMpesaTransactions)
app.use("/users/cryptomus", cryptoMus);
app.use("/users/callback", webhook);
app.use("/users/webhook", getWebhook);
app.use("/users/proxy", postProxy);
app.use("/users/prices", getPrices);
app.use("/users/elite", eliteProxy);
app.use("/users/order-proxy", orderProxy);
app.use("/users/create-subuser", createSubUser);
app.use("/users/update-username", updateSubUserUsername);
app.use("/users/update-password", updateSubUserPassword);
app.use("/users/add-traffic", addTraffic);
app.use("/users/create-order", createOrder);
app.use("/users/forgot-password", forgotPassword);
app.use("/users/pay-reference", payReferees);



app.get('/', (req, res) => {
  res.send('Hello World!');
});

db.sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  console.error('Unable to connect to the database:', err);
});
