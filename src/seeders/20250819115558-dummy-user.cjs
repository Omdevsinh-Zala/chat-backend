'use strict';

const { genSalt, hash } = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface) {
    const salt = await genSalt(5);
    const hashPass = await hash("11111111", salt);

    await queryInterface.bulkInsert('users', [{
        id: uuidv4(),
        first_name: "some",
        last_name: "thing",
        email: "some@one.com",
        password: hashPass,
    }], {});
  },

  async down(queryInterface) {
    
    await queryInterface.bulkDelete('users', {
      email:"some@one.com"
    }, {});
  }
};
