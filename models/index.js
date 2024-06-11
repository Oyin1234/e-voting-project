// Import the Sequelize library and the necessary data types
const { Sequelize, DataTypes } = require("sequelize");

// Create a new Sequelize instance, using MySQL as the dialect, this establishes a connection to our local database
const sequelize = new Sequelize("ebilling", "root", "root", {
  host: "localhost",
  dialect: "mysql",
});

// Define the User model with 'username' and 'password' fields
const User = sequelize.define("User", {
  firstName: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Candidates = sequelize.define("Candidates", {
  firstName: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  votes: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Define the Vote model with a 'candidate' field
const Vote = sequelize.define("Vote", {
  candidate: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// A User can have one Vote
User.hasOne(Vote);
Vote.belongsTo(User);

// Self-executing async function to synchronize the models with the database, therefore creating the User and Vote Tables on the database
(async () => {
  await sequelize.sync();
})();

// Export the User and Vote models and the sequelize instance for use in our server
module.exports = { User, Vote, Candidates, sequelize };
