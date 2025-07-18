const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

// GET /api/expenses
router.get('/', async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = { userId: req.user.id };
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  const expenses = await Expense.find(filter).sort({ date: -1 });
  res.json(expenses);
});

// POST /api/expenses
router.post('/', async (req, res) => {
  const { amount, category, description, date } = req.body;
  const expense = new Expense({
    userId: req.user.id,
    amount,
    category,
    description,
    date,
  });
  await expense.save();
  res.json(expense);
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  const exp = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
  if (!exp) return res.status(404).json({ message: 'Expense not found' });

  Object.assign(exp, req.body);
  await exp.save();
  res.json(exp);
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  const deleted = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!deleted) return res.status(404).json({ message: 'Expense not found' });
  res.json({ message: 'Deleted' });
});

module.exports = router;
