// Authentication Controller
// Handles HTTP requests and responses for auth endpoints

import { authenticateUser, registerUser } from '../services/authService.js';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const register = async (req, res) => {
  const { fullName, email, password, birthDate } = req.body;

  if (!fullName || !email || !password || !birthDate) {
    return res.status(400).json({
      success: false,
      error: 'Please fill in all required fields'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email'
    });
  }

  try {
    const result = await registerUser({ fullName, email, password, birthDate });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      data: { message: 'User created successfully' }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please fill in email and password'
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  try {
    const result = await authenticateUser({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.status(200).json({
      success: true,
      data: { message: 'Login successful' }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
