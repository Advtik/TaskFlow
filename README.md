# 🚀 TaskFlow

TaskFlow is a full-stack real-time collaborative task management platform built to simulate production-grade team workflow systems.

It enables users to create boards, manage lists and tasks, assign members, track activity, and collaborate in real-time.

---

## 🧰 Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- React Router
- DnD Kit
- Socket.IO Client

**Backend**
- Node.js
- Express.js
- PostgreSQL
- Socket.IO
- JWT Authentication

**Database**
- PostgreSQL (Relational Design with Indexing)

---

# 📌 Key Features

- 🔐 JWT-based Authentication
- 📦 Board & Member Management
- 📋 Ordered Lists
- 📝 Ordered Tasks
- 🔁 Drag & Drop (Transaction Safe)
- 👥 Task Assignment
- 📜 Activity Logging
- 🔎 Search & Pagination
- ⚡ Real-Time Synchronization (Board Level)

---

# 🏗 Architecture Overview

TaskFlow follows a layered architecture:

```
Client (Browser)
      ↓
React Frontend (Vite)
      ↓
Express REST API
      ↓
PostgreSQL Database
      ↓
Socket.IO Real-Time Layer
```

- Frontend handles UI and state management.
- Backend manages business logic and authorization.
- PostgreSQL ensures relational consistency.
- Socket.IO enables real-time board collaboration.

📄 Detailed Architecture Document:  
https://drive.google.com/file/d/1rHvUJFILXh0m6LvcqMW8mL5C4OoMbdGE/view?usp=sharing

---

# 🗄 Database Schema

The database is fully normalized and relational.

### Core Entities:

- users
- boards
- board_members (Many-to-Many)
- lists
- tasks
- task_assignments (Many-to-Many)
- activities (Audit Log)

Indexes are applied on:

- Foreign keys
- Search fields
- Filtering columns

📄 Full Schema Document:  
https://drive.google.com/file/d/1lqPPxwBDPCzBPQcbrvY-fGPU7DvxbPK7/view?usp=sharing

📊 Schema Diagram:  
https://drive.google.com/file/d/1_1x9H9llaXV20h1lXblZuQyo2WX_JsYw/view?usp=sharing

---

# 🔌 API Contract Design

All protected routes require:

```
Authorization: Bearer <JWT_TOKEN>
```

Main API groups:

- Auth APIs
- Board APIs
- List APIs
- Task APIs
- Task Movement APIs
- Task Assignment APIs
- Activity APIs
- Search & Pagination APIs

📄 Complete API Documentation:  
https://drive.google.com/file/d/1DkryJM6wxIG6yCx7gX4213Xy-Bj5Z4DZ/view?usp=sharing

---

# ⚡ Real-Time Synchronization Strategy

TaskFlow uses a **board-based socket room strategy**.

When a user opens a board:

```js
socket.emit("joinBoard", boardId)
```

Backend:

```js
socket.join(boardId)
```

All updates are emitted only to that board room:

- taskCreated
- taskMoved
- taskUpdated
- taskDeleted
- memberAdded
- listCreated
- listDeleted
- activity:new

This ensures:

- Efficient broadcasting
- Board-level isolation
- Low network overhead
- Consistent state across clients

---

# 🚀 Local Development Setup Guide

Follow these steps carefully.

---

## 1️⃣ Prerequisites

Install:

- Node.js (v18+)
- npm
- PostgreSQL (v14+)
- Git

Check versions:

```bash
node -v
npm -v
psql --version
```

---

## 2️⃣ Clone Repository

```bash
git clone https://github.com/Advtik/TaskFlow
cd TaskFlow
```

Project structure:

```
TaskFlow/
 ├── taskflow-frontend/
 └── taskflow-backend/
```

---

# 🗄 Database Setup

## Step 1 — Open PostgreSQL CLI

```bash
psql -U postgres
```

Enter password.

---

## Step 2 — Create Database

Inside PostgreSQL:

```sql
CREATE DATABASE taskflow;
```

Exit:

```sql
\q
```

---

## Step 3 — Run Schema File

```bash
cd TaskFlow
cd taskflow-backend
psql -U postgres -d taskflow -f database/schema.sql
```

This creates all tables, indexes, and extensions.

---

# ⚙ Backend Setup

```bash
cd taskflow-backend
npm install
```

Create:

```
taskflow-backend/.env
```

Add:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskflow
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Start server:

```bash
npm run dev
```

Test:

```
http://localhost:5000/api/health
```

---

# 🎨 Frontend Setup

Open new terminal:

```bash
cd TaskFlow
cd taskflow-frontend
npm install
```

Create:

```
taskflow-frontend/.env
```

Add:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

Start frontend:

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

# 📈 Scalability Considerations

- PostgreSQL connection pooling
- Indexed search queries
- Transaction-based task movement
- Socket room isolation
- Modular REST structure
- Clean separation of frontend and backend

Future scalability options:

- Redis adapter for Socket.IO
- Load-balanced backend servers
- Horizontal scaling
- Database read replicas

---

# 📌 Assumptions & Trade-offs

- Task editing restricted to task creator
- Board-level authorization
- No soft-deletes (hard deletes used)
- Real-time limited to board scope
- Pagination implemented for search endpoints

---

# 🧪 Testing Flow

1. Register user  
2. Create board  
3. Create lists  
4. Create tasks  
5. Open same board in another browser  
6. Observe real-time updates  

---

# 📄 Documentation Links

- 📘 API Documentation  
  https://drive.google.com/file/d/1DkryJM6wxIG6yCx7gX4213Xy-Bj5Z4DZ/view?usp=sharing

- 🏗 Architecture Document  
  https://drive.google.com/file/d/1rHvUJFILXh0m6LvcqMW8mL5C4OoMbdGE/view?usp=sharing

- 🗄 Database Schema Document  
  https://drive.google.com/file/d/1lqPPxwBDPCzBPQcbrvY-fGPU7DvxbPK7/view?usp=sharing

- 📊 Schema Diagram  
  https://drive.google.com/file/d/1_1x9H9llaXV20h1lXblZuQyo2WX_JsYw/view?usp=sharing

---

# Author
 - Adwiteek Samadder
