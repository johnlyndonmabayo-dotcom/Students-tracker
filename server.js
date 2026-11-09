const express = require("express");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY due_date ASC, id DESC", [], (error, rows) => {
    if (error) return res.status(500).json({error:"Unable to load tasks."});
    res.json(rows);
  });
});

app.post("/api/tasks", (req, res) => {
  const {title, subject, due_date, priority = "Medium", status = "pending"} = req.body;
  if (!validTask({title, subject, due_date, priority, status})) {
    return res.status(400).json({error:"Please provide valid task details."});
  }
  db.run(
    "INSERT INTO tasks (title, subject, due_date, priority, status) VALUES (?, ?, ?, ?, ?)",
    [title.trim(), subject.trim(), due_date, priority, status],
    function(error) {
      if (error) return res.status(500).json({error:"Unable to create task."});
      db.get("SELECT * FROM tasks WHERE id = ?", [this.lastID], (getError, row) => {
        if (getError) return res.status(500).json({error:"Task was saved, but could not be loaded."});
        res.status(201).json(row);
      });
    }
  );
});

app.put("/api/tasks/:id", (req, res) => {
  const {title, subject, due_date, priority, status} = req.body;
  if (!validTask({title, subject, due_date, priority, status})) {
    return res.status(400).json({error:"Please provide valid task details."});
  }
  db.run(
    "UPDATE tasks SET title = ?, subject = ?, due_date = ?, priority = ?, status = ? WHERE id = ?",
    [title.trim(), subject.trim(), due_date, priority, status, req.params.id],
    function(error) {
      if (error) return res.status(500).json({error:"Unable to update task."});
      if (!this.changes) return res.status(404).json({error:"Task not found."});
      db.get("SELECT * FROM tasks WHERE id = ?", [req.params.id], (getError, row) => {
        if (getError) return res.status(500).json({error:"Unable to load updated task."});
        res.json(row);
      });
    }
  );
});

app.delete("/api/tasks/:id", (req, res) => {
  db.run("DELETE FROM tasks WHERE id = ?", [req.params.id], function(error) {
    if (error) return res.status(500).json({error:"Unable to delete task."});
    if (!this.changes) return res.status(404).json({error:"Task not found."});
    res.json({message:"Task deleted successfully."});
  });
});

function validTask(task) {
  const priorities = ["High", "Medium", "Low"];
  const statuses = ["pending", "in-progress", "completed"];
  return typeof task.title === "string" && task.title.trim().length > 0 &&
    task.title.length <= 120 && typeof task.subject === "string" &&
    task.subject.trim().length > 0 && task.subject.length <= 80 &&
    typeof task.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.due_date) &&
    priorities.includes(task.priority) && statuses.includes(task.status);
}

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, "0.0.0.0", () => console.log(`Student Task Tracker running at http://localhost:${PORT}`));
