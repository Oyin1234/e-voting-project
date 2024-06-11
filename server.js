const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { User, Vote, sequelize, Candidates } = require("./models");
const app = express();
const PORT = 3001;

app.use(cors());

const SECRET_KEY = "your_secret_key";

// Middleware
app.use(bodyParser.json());

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Route to register a new user
app.post("/register", async (req, res) => {
  const { firstName, lastName, username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password || !firstName || !lastName) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    await User.create({
      firstName,
      lastName,
      username,
      password: hashedPassword,
    });
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging purposes
    res
      .status(500)
      .json({ message: "An error occurred while registering the user" });
  }
});

// Route to login a user

app.post("/login", async (req, res) => {
  const { username, password } = req.body; // Destructure username and password from 	request body

  // Find the user by username
  const user = await User.findOne({ where: { username } });

  console.log("this is user", user);

  // If user does not exist, return an error
  if (!user) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  // Compare the provided password with the stored hashed password
  const validPassword = await bcrypt.compare(password, user.password);
  // If the password is incorrect, return an error
  if (!validPassword) {
    return res.status(400).json({ message: "Invalid username or password" });
  }

  // Generate a JWT token with the username and a 1-hour expiration
  const token = jwt.sign({ username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });

  // Return the token in the response
  res.json({ token, user });
});

// Route to cast a vote (protected)
app.post("/vote", async (req, res) => {
  const { candidate, username } = req.body; // Destructure candidate from request body

  // Find the user by username
  const user = await User.findOne({ where: { username: username } });

  if (!candidate) {
    return res.status(400).json({ message: "No candidate selected" });
  }

  // Check if the user has already voted
  const userVote = await Vote.findOne({ where: { UserId: user.id } });
  if (userVote) {
    return res.status(400).json({ message: "User has already voted" });
  }

  // Create a new vote
  await Vote.create({ candidate, UserId: user.id });
  await Candidates.increment("votes", { by: 1, where: { id: candidate } });

  // Respond with a success message
  res.status(200).json({ message: `Vote casted successfully` });
});

// Route to get vote counts (protected)
app.get("/votes", async (req, res) => {
  // Fetch all votes from the database
  const votes = await Vote.findAll();

  // Count the number of votes for each candidate
  const voteCounts = votes.reduce((acc, vote) => {
    acc[vote.candidate] = (acc[vote.candidate] || 0) + 1;
    return acc;
  }, {});

  // Respond with the vote counts
  res.status(200).json(voteCounts);
});

app.get("/candidates", async (req, res) => {
  // Fetch all votes from the database
  const candidates = await Candidates.findAll();

  // Respond with the vote counts
  res.status(200).json(candidates);
});

app.get("/users", async (req, res) => {
  // Fetch all votes from the database
  const users = await User.findAll();

  // Respond with the user counts
  res.status(200).json(users);
});

// Start the server by running npm start on the terminal
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
