module.exports = (sequelize, DataTypes) => {
    const TransactionDetails = sequelize.define('TransactionDetails', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users', // Refers to the 'Users' table
          key: 'id',
        },
        allowNull: false,
      },
      invoiceId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mpesaReferenceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW, 
      },
    });
  
    // Define associations
    TransactionDetails.associate = (models) => {
      TransactionDetails.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    };
  
    return TransactionDetails;
  };
  