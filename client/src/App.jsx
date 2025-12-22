import React, { useEffect, useState } from "react";
import api, { loginUser } from "./services/api";
import "./App.css";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from "chart.js";

import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function App() {
  // ======================
  // AUTH STATE (FIXED)
  // ======================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  // ======================
  // DATA STATE
  // ======================
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newHabit, setNewHabit] = useState("");
  const [newTask, setNewTask] = useState("");

  // ======================
  // LOGIN HANDLER (FIXED)
  // ======================
  const handleLogin = async () => {
    try {
      const data = await loginUser(email, password);

      // ✅ SAVE TOKEN
      localStorage.setItem("token", data.token);
      setIsLoggedIn(true);

      // ✅ LOAD USER DATA
      loadAll();
    } catch (err) {
      alert("Login failed");
      console.error(err.response?.data || err.message);
    }
  };

  // ======================
  // LOAD DATA
  // ======================
  const loadAll = () => {
    api.get("/habits").then(res => setHabits(res.data));
    api.get("/tasks").then(res => setTasks(res.data));
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadAll();
    }
  }, [isLoggedIn]);

  // ======================
  // HABITS
  // ======================
  const addHabit = () => {
    if (!newHabit.trim()) return;
    api.post("/habits", { title: newHabit }).then(() => {
      setNewHabit("");
      loadAll();
    });
  };

  const markHabitDone = (id) => {
    api.put(`/habits/${id}/done`).then(loadAll);
  };

  // ======================
  // TASKS
  // ======================
  const addTask = () => {
    if (!newTask.trim()) return;
    api.post("/tasks", { title: newTask }).then(() => {
      setNewTask("");
      loadAll();
    });
  };

  const completeTask = (id) => {
    api.put(`/tasks/${id}/complete`).then(loadAll);
  };

  // ======================
  // DASHBOARD DATA
  // ======================
  const habitsDone = habits.filter(h => h.doneToday).length;
  const tasksDone = tasks.filter(t => t.completed).length;
  const habitsPending = habits.length - habitsDone;
  const tasksPending = tasks.length - tasksDone;

  const pieData = {
    labels: ["Habits Done", "Habits Pending", "Tasks Done", "Tasks Pending"],
    datasets: [
      {
        data: [habitsDone, habitsPending, tasksDone, tasksPending],
        backgroundColor: ["#22c55e", "#f97316", "#3b82f6", "#ef4444"]
      }
    ]
  };

  const barData = {
    labels: ["Habits", "Tasks"],
    datasets: [
      {
        label: "Completed",
        data: [habitsDone, tasksDone],
        backgroundColor: "#4f46e5"
      },
      {
        label: "Pending",
        data: [habitsPending, tasksPending],
        backgroundColor: "#9ca3af"
      }
    ]
  };

  // ======================
  // 🔐 LOGIN SCREEN
  // ======================
  if (!isLoggedIn) {
    return (
      <div className="container">
        <h1>Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <br />

        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  // ======================
  // ✅ MAIN DASHBOARD
  // ======================
  return (
    <div className="container">
      <h1>Daily Progress Tracker</h1>

      <div className="card-row">
        <StatCard title="Habits Done" value={`${habitsDone}/${habits.length}`} />
        <StatCard title="Tasks Done" value={`${tasksDone}/${tasks.length}`} />
      </div>

      <div className="card-row" style={{ marginTop: "40px" }}>
        <div className="card" style={{ flex: 1 }}>
          <h3>Overall Progress</h3>
          <Pie data={pieData} />
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h3>Habits vs Tasks</h3>
          <Bar data={barData} />
        </div>
      </div>

      {/* HABITS */}
      <div className="section">
        <h2>Habits</h2>
        <div className="input-row">
          <input
            placeholder="Enter habit"
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
          />
          <button onClick={addHabit}>Add Habit</button>
        </div>

        <div className="list">
          {habits.map(h => (
            <div key={h._id} className="list-item">
              <span>
                {h.title} | Streak: {h.streak}
              </span>
              {h.doneToday ? (
                <span className="done">✔ Done</span>
              ) : (
                <button onClick={() => markHabitDone(h._id)}>Mark Done</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TASKS */}
      <div className="section">
        <h2>Tasks</h2>
        <div className="input-row">
          <input
            placeholder="Enter task"
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
          />
          <button onClick={addTask}>Add Task</button>
        </div>

        <div className="list">
          {tasks.map(t => (
            <div key={t._id} className="list-item">
              <span>{t.title}</span>
              {t.completed ? (
                <span className="done">✔ Completed</span>
              ) : (
                <button onClick={() => completeTask(t._id)}>
                  Mark Complete
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
