const express = require("express");
const router = express.Router();

let tasks = [];

// Get all tasks
router.get("/", (req, res) => {
  res.json(tasks);
});

// Add new task
router.post("/", (req, res) => {
  const task = {
    _id: Date.now(),
    title: req.body.title,
    completed: false
  };
  tasks.push(task);
  res.json(task);
});

// Mark task as completed
router.put("/:id/complete", (req, res) => {
  const task = tasks.find(t => t._id == req.params.id);

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  task.completed = true;
  res.json(task);
});

module.exports = router;
