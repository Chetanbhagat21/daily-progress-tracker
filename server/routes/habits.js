const express = require("express");
const router = express.Router();

let habits = [];

// Get all habits
router.get("/", (req, res) => {
  res.json(habits);
});

// Add new habit
router.post("/", (req, res) => {
  const habit = {
    _id: Date.now(),
    title: req.body.title,
    streak: 0,
    doneToday: false
  };
  habits.push(habit);
  res.json(habit);
});

// Mark habit as done
router.put("/:id/done", (req, res) => {
  const habit = habits.find(h => h._id == req.params.id);

  if (!habit) {
    return res.status(404).json({ message: "Habit not found" });
  }

  if (!habit.doneToday) {
    habit.doneToday = true;
    habit.streak += 1;
  }

  res.json(habit);
});

// Reset daily status (optional)
router.put("/reset", (req, res) => {
  habits.forEach(h => (h.doneToday = false));
  res.json({ message: "Daily reset done" });
});

module.exports = router;
