module.exports = (sequelize, DataTypes) => {
    const SubUsers = sequelize.define('SubUsers', {
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
      hash: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      username:{
        type: DataTypes.STRING,
        allowNull: false
      },
      password:{
        type: DataTypes.STRING,
        allowNull: false
      }
    });
  
    // Define associations
    SubUsers.associate = (models) => {
        SubUsers.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    };
  
    return SubUsers;
  };
  