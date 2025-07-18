require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./backend/routes/auth');
const expenseRoutes = require('./backend/routes/expenses');

const app = express();
app.use(cors());
app.use(express.json());

// Root route for health check or info
app.get('/', (req, res) => {
  res.send('Expense Tracker Backend is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(5000, () => console.log('Server running on port 5000'));
  })
  .catch(err => console.error('MongoDB connection failed:', err));
