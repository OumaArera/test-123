module.exports = (sequelize, DataTypes) => {
  const AccountStructure = sequelize.define('AccountStructure', {
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users', 
        key: 'id',
      },
      allowNull: false,
    },
    balance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0, 
    },
    bitCoinBalance: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0, 
    },
    eliteResidentialHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    residentialProxiesIDsArray: {
      type: DataTypes.JSON, 
      allowNull: false,
    },
    datacenterProxiesIDsArray: {
      type: DataTypes.JSON, 
      allowNull: false,
    },
    invitedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  // Define associations
  AccountStructure.associate = (models) => {
    AccountStructure.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return AccountStructure;
};
