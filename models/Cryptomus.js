module.exports = (sequelize, DataTypes) => {
    const Cryptomus = sequelize.define('Cryptomus', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users', 
          key: 'id',
        },
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0, 
      },
      uuid: {
        type: DataTypes.STRING,
        allowNull: false, 
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentAmount: {
        type: DataTypes.FLOAT, 
        allowNull: false,
      },
      paymentAmountUsd: {
        type: DataTypes.FLOAT, 
        allowNull: false,
      },
      merchantAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      network:{
        type: DataTypes.STRING,
        allowNull: false
      },
      currency:{
        type: DataTypes.STRING,
        allowNull: false
      },
      payerCurrency:{
        type: DataTypes.STRING,
        allowNull: false
      },
      transactionId:{
        type: DataTypes.STRING,
        allowNull: false
      },
      sign:{
        type: DataTypes.STRING,
        allowNull: false
      }
    });
  
    // Define associations
    Cryptomus.associate = (models) => {
        Cryptomus.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    };
  
    return Cryptomus;
  };
  