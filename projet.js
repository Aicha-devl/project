const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer'); // For sending email

dotenv.config();

const app = express();

app.use(bodyParser.json());

const connection = mysql.createPool({
  host: 'localhost',
  user: 'aicha',
  password: 'kill',
  database: 'pro_user'
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to generate random verification code
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit code
}

app.post('/register', async (req, res) => {
  const { name, surname, email, phone, password } = req.body;

  // Basic input validation (add more as needed)
  if (!name || !surname || !email || !phone || !password) {
    return res.status(400).json({ message: 'Missing required fields!' });
  }

  // Regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate email format
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address!' });
  }

  try {
    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Send verification email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Code',
      text: `Your verification code is: ${verificationCode}`
    });

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user data into the database (using prepared statement)
    const sql = 'INSERT INTO users (name, surname, email, phone, password, verification_code) VALUES (?, ?, ?, ?, ?, ?)';
    await connection.query(sql, [name, surname, email, phone, hashedPassword, verificationCode]);

    res.status(201).json({ message: 'User registered successfully! Please check your email for verification.' });
  } catch (err) {
    console.error('Error registering user: ', err);
    // Handle specific errors (e.g., duplicate email)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists!' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Endpoint to verify email with verification code
app.post('/verify-email', async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    // Retrieve verification code from the database
    const [rows] = await connection.query('SELECT verification_code FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Email not found!' });
    }

    const storedVerificationCode = rows[0].verification_code;

    if (verificationCode !== storedVerificationCode) {
      return res.status(400).json({ message: 'Incorrect verification code!' });
    }

    // Update user's email verification status in the database
    await connection.query('UPDATE users SET is_verified = true WHERE email = ?', [email]);

    res.status(200).json({ message: 'Email verified successfully!' });
  } catch (err) {
    console.error('Error verifying email: ', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to my application!');
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
