const express = require('express');
const db = require('./models');


const cors = require('cors'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Use CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());

// Define routes
app.use('/users/signup', require('./authenticate/signup'));
app.use('/users/login', require('./authenticate/signin'));
app.use('/users/users', require('./users/users'));
app.use("/users/remove", require("./users/remove"));
app.use("/users/account", require("./accountStructure/postAccount"));
app.use("/users/account", require("./accountStructure/getAccount"));
app.use("/users/update-proxy", require("./accountStructure/updateResidentialProxies"));
app.use("/users/update-datacentre", require("./accountStructure/updateDatacentreProxies"));
app.use("/users/mpesa", require("./payments/mpesa"))
app.use("/users/mpesa", require("./payments/getTransaction"))
app.use("/users/cryptomus", require("./payments/cryptomus"));
app.use("/users/callback", require("./payments/cryptomusWebhook"));
app.use("/users/webhook", require("./payments/getCryptomusTransactions"));
app.use("/users/proxy", require("./proxy/spaceproxy"));
app.use("/users/prices", require("./proxy/residentialPricing"));
app.use("/users/elite", require("./proxy/eliteProxy"));
app.use("/users/order-proxy", require("./proxy/orderProxy"));
app.use("/users/create-subuser", require("./subUser/createSubUser"));
app.use("/users/update-username", require("./subUser/updateUsername"));
app.use("/users/update-password", require("./subUser/updatePassword"));
app.use("/users/add-traffic", require("./proxy/orderElite"));
app.use("/users/create-order", require("./proxy/orderResidential"));
app.use("/users/forgot-password", require("./authenticate/forgotPassword"));
app.use("/users/pay-reference", require("./payments/payReferees"));



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
