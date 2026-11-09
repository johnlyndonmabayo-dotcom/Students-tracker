# Student Task Tracker

A responsive student dashboard for organizing school tasks. It uses Express.js as the backend server and SQLite as the database.

## Features

- Create a task with a title, subject, due date, priority, and status.
- Read and display saved tasks.
- Update existing task details.
- Delete tasks.
- Search tasks and filter by status or priority.
- View task totals, pending tasks, completed tasks, and tasks due today.

## Requirements

- Node.js
- npm

## Run the project

1. Open the project folder in a terminal.
2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

The SQLite database file (`school.db`) is created automatically when the server starts. Task records are saved in that database.
