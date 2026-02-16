
import streamlit as st
import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import hashlib

# ---------------- CONFIG ----------------
st.set_page_config(page_title="Industry Grade Daily Progress Tracker", layout="wide")

# ---------------- SECURITY ----------------
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ---------------- DATABASE ----------------
def create_connection():
    return sqlite3.connect("progress.db", check_same_thread=False)

def create_tables():
    conn = create_connection()
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    password TEXT
                )''')

    c.execute('''CREATE TABLE IF NOT EXISTS tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    task TEXT,
                    category TEXT,
                    priority TEXT,
                    status TEXT,
                    date TEXT
                )''')

    c.execute('''CREATE TABLE IF NOT EXISTS daily_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    hours REAL,
                    notes TEXT,
                    mood INTEGER,
                    date TEXT
                )''')

    conn.commit()
    conn.close()

create_tables()
conn = create_connection()

# ---------------- AUTH ----------------
def login():
    st.subheader("Login")
    username = st.text_input("Username")
    password = st.text_input("Password", type="password")
    if st.button("Login"):
        hashed = hash_password(password)
        user = conn.execute("SELECT * FROM users WHERE username=? AND password=?", (username, hashed)).fetchone()
        if user:
            st.session_state.user = username
            st.success("Login Successful")
            st.rerun()
        else:
            st.error("Invalid Credentials")

def signup():
    st.subheader("Create Account")
    username = st.text_input("New Username")
    password = st.text_input("New Password", type="password")
    if st.button("Sign Up"):
        try:
            hashed = hash_password(password)
            conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed))
            conn.commit()
            st.success("Account Created")
        except:
            st.error("Username already exists")

if "user" not in st.session_state:
    option = st.sidebar.selectbox("Select", ["Login", "Sign Up"])
    if option == "Login":
        login()
    else:
        signup()
    st.stop()

# ---------------- MAIN ----------------
st.title("Industry Grade Daily Progress Tracker")
st.sidebar.write("Logged in as:", st.session_state.user)

menu = ["Add Task", "Daily Log", "Dashboard", "Export Data", "Logout"]
choice = st.sidebar.selectbox("Navigation", menu)

# ---------------- ADD TASK ----------------
if choice == "Add Task":
    task = st.text_input("Task Name")
    category = st.selectbox("Category", ["Study", "Fitness", "Project", "Personal"])
    priority = st.selectbox("Priority", ["High", "Medium", "Low"])
    status = st.selectbox("Status", ["Pending", "Completed"])

    if st.button("Add Task"):
        date = datetime.now().strftime("%Y-%m-%d")
        conn.execute("INSERT INTO tasks (username, task, category, priority, status, date) VALUES (?, ?, ?, ?, ?, ?)",
                     (st.session_state.user, task, category, priority, status, date))
        conn.commit()
        st.success("Task Added")

# ---------------- DAILY LOG ----------------
elif choice == "Daily Log":
    hours = st.number_input("Hours Worked/Studied", min_value=0.0, step=0.5)
    notes = st.text_area("Notes")
    mood = st.slider("Mood (1-5)", 1, 5)

    if st.button("Save Log"):
        date = datetime.now().strftime("%Y-%m-%d")
        conn.execute("INSERT INTO daily_logs (username, hours, notes, mood, date) VALUES (?, ?, ?, ?, ?)",
                     (st.session_state.user, hours, notes, mood, date))
        conn.commit()
        st.success("Log Saved")

# ---------------- DASHBOARD ----------------
elif choice == "Dashboard":
    tasks_df = pd.read_sql_query("SELECT * FROM tasks WHERE username=?", conn, params=(st.session_state.user,))
    logs_df = pd.read_sql_query("SELECT * FROM daily_logs WHERE username=?", conn, params=(st.session_state.user,))

    col1, col2, col3 = st.columns(3)

    if not tasks_df.empty:
        total = len(tasks_df)
        completed = len(tasks_df[tasks_df["status"] == "Completed"])
        percent = (completed / total) * 100
    else:
        total = completed = percent = 0

    if not logs_df.empty:
        total_hours = logs_df["hours"].sum()
        avg_mood = logs_df["mood"].mean()
    else:
        total_hours = avg_mood = 0

    productivity_score = (completed * 2) + total_hours

    col1.metric("Tasks Completed", completed)
    col2.metric("Total Hours", total_hours)
    col3.metric("Productivity Score", productivity_score)

    # Streak Calculation
    if not logs_df.empty:
        logs_df["date"] = pd.to_datetime(logs_df["date"])
        unique_dates = sorted(logs_df["date"].dt.date.unique(), reverse=True)
        streak = 0
        today = datetime.today().date()
        for i in range(len(unique_dates)):
            if unique_dates[i] == today - timedelta(days=i):
                streak += 1
            else:
                break
    else:
        streak = 0

    st.metric("Current Streak (Days)", streak)

    if not tasks_df.empty:
        fig = plt.figure()
        tasks_df["status"].value_counts().plot(kind="bar")
        st.pyplot(fig)

# ---------------- EXPORT ----------------
elif choice == "Export Data":
    tasks_df = pd.read_sql_query("SELECT * FROM tasks WHERE username=?", conn, params=(st.session_state.user,))
    logs_df = pd.read_sql_query("SELECT * FROM daily_logs WHERE username=?", conn, params=(st.session_state.user,))

    st.download_button("Download Tasks CSV", tasks_df.to_csv(index=False), "tasks.csv")
    st.download_button("Download Logs CSV", logs_df.to_csv(index=False), "logs.csv")

# ---------------- LOGOUT ----------------
elif choice == "Logout":
    del st.session_state.user
    st.rerun()
