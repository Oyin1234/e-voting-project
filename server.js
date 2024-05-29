const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User, Vote, sequelize } = require("./models");
const app = express();
const PORT = 3000;

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
  const { username, password } = req.body;

  // Check if username or password is missing
  if (!username || !password) {
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
    await User.create({ username, password: hashedPassword });
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
  res.json({ token });
});

// Route to cast a vote (protected)
app.post("/vote", authenticateToken, async (req, res) => {
  const { candidate } = req.body; // Destructure candidate from request body
  const username = req.user.username; // Get username from authenticated token

  // Find the user by username
  const user = await User.findOne({ where: { username } });

  // Check if the user has already voted
  const userVote = await Vote.findOne({ where: { UserId: user.id } });
  if (userVote) {
    return res.status(400).json({ message: "User has already voted" });
  }

  // Check if the candidate is valid
  if (["candidateA", "candidateB"].includes(candidate)) {
    // Create a new vote
    await Vote.create({ candidate, UserId: user.id });
    // Respond with a success message
    res.status(200).json({ message: `Vote cast for ${candidate}` });
  } else {
    // Respond with an error message if the candidate is invalid
    res.status(400).json({ message: "Invalid candidate" });
  }
});

// Route to get vote counts (protected)
app.get("/votes", authenticateToken, async (req, res) => {
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

// Start the server by running npm start on the terminal
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
