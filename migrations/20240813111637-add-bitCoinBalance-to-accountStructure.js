'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('AccountStructures', 'bitCoinBalance', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0, // Set default value to 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('AccountStructures', 'bitCoinBalance');
  }
};
