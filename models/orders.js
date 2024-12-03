module.exports = (sequelize, DataTypes) => {
    const Orders = sequelize.define('Orders', {
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users', 
          key: 'id',
        },
        allowNull: false,
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 0, 
      },
      dateTime: {
        type: DataTypes.DATE,
        allowNull: false, 
      },
      orderData: {
        type: DataTypes.JSON,
        allowNull: false,
      }
    });
  
    // Define associations
    Orders.associate = (models) => {
        Orders.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    };
  
    return Orders;
  };
  