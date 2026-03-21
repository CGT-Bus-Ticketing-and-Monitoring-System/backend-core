# 🚌 CGT Bus Ticketing & Monitoring System - Core API

![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-Backend-black?style=for-the-badge&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Ephemeral_DB-2496ED?style=for-the-badge&logo=docker)
![Jest](https://img.shields.io/badge/Jest-Tested-C21325?style=for-the-badge&logo=jest)

> The central backend service powering the CGT Bus Ticketing ecosystem. This API handles secure passenger authentication, live IoT hardware tap-ins/tap-outs, fleet tracking, and real-time operator analytics.

---

## ✨ System Architecture & Features

- **🔐 Robust Security:** JWT-based authentication, Bcrypt password hashing, and Express route-level middleware protection.
- **🛰️ IoT Hardware Integration:** Dedicated endpoints designed to receive real-time RFID reads and GPS coordinates from physical bus hardware.
- **📊 Real-Time Analytics:** Complex SQL aggregations providing revenue, rider demographics, and weekly route performance metrics.
- **🚀 Automated CI/CD:** Enterprise-grade GitHub Actions pipeline featuring an ephemeral Docker MySQL database for isolated Integration & Unit testing before deployment.

---

## 🛠️ Prerequisites

To run this project locally, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20.x or higher)
- [MySQL](https://www.mysql.com/) (v8.0)
- Git

---

## 💻 Local Setup & Installation

**1. Clone the repository**
```bash
git clone [https://github.com/CGT-Bus-Ticketing-and-Monitoring-System/backend-core.git](https://github.com/CGT-Bus-Ticketing-and-Monitoring-System/backend-core.git)](https://github.com/CGT-Bus-Ticketing-and-Monitoring-System/backend-core.git)
cd backend-core
```

### 2. Environment Configuration
Create a `.env` file in the root directory. This keeps your secrets safe and ensures the testing pipeline doesn't clash with your live database.
```env
# Server Config
PORT=3000
NODE_ENV=development

# Database Config (Update with your local MySQL credentials)
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_local_password
DB_NAME=db_name

# Security
JWT_SECRET=your_super_secret_dev_key
```

### 3. Install Dependencies
Install the required packages, including our automated QA tools (Jest & Supertest).
```bash
npm install
```

### 4. Run the Development Server
Start the Express API server to begin listening for incoming requests.
```bash
npm start
```
*The API will now be live at `http://localhost:3000`*

### 5. Run the Testing Suite (Local CI Simulation)
Want to verify your code before pushing to GitHub? You can run our isolated Unit and Integration tests locally. Jest will automatically detect the test environment and safely mock the database connections.
```bash
npm test
```

---

## 🧪 Quality Assurance & Testing

This repository enforces strict QA standards. Our testing suite utilizes **Jest** for isolated Unit Testing (logic/auth) and **Supertest** for Route Integration Testing.

To prevent port collisions and database corruption, our server files automatically isolate themselves during the testing lifecycle. Tests include open-handle detection and coverage reporting to ensure maximum stability.

---

## 🏗️ Deployment Pipeline

This repository utilizes a multi-stage **GitHub Actions CI/CD Pipeline**:
1. **CI (Continuous Integration):** On every push/PR to `main`, an Ubuntu server is spun up. It pulls a fresh `mysql:8.0` Docker container, seeds it with our database schema, and runs the full Jest/Supertest suite against the live endpoints.
2. **CD (Continuous Deployment):** If (and only if) the testing matrix passes, a secondary workflow securely SSHs into our DigitalOcean production server, pulls the latest code, reinstalls dependencies, and seamlessly restarts the PM2 process.

---
*Developed for the CGT Ticketing Platform.*
