# **TaskFlow Web App** 🌟

![image](https://github.com/user-attachments/assets/815c1b68-91ee-4653-b442-1b96f4b79a5f)

> **TaskFlow** is an intuitive **task management and team collaboration web app** designed to make organizing tasks and managing teams seamless and efficient. Whether you're a freelancer or part of a dynamic team, TaskFlow is the ultimate solution to stay organized and productive.

---

## **Project Details**  

### Developer Information  
- **Name:** Rohit Navinchandra Kandpal  
- **Company:** CODTECH IT SOLUTIONS PVT. LTD.  
- **Employee ID:** CT08DHC  
- **Domain:** Full Stack Web Development  

### Internship Duration  
- **Start Date:** 20th December 2024  
- **End Date:** 20th January 2025  

### Mentor  
- **Name:** Neela Santhosh Kumar  

This project is part of my professional journey at CODTECH IT SOLUTIONS, showcasing my expertise in full-stack web development and dedication to building innovative solutions under expert guidance.  

---

## ⚠️ **Project Status: Ongoing** ⚠️  

TaskFlow is currently an **active development project**, and we're working hard to refine its features and enhance its functionality. The project is **in beta phase**, with several features already implemented, but there are some **known bugs** and **areas requiring improvement**.  

### 🛠️ Work in Progress:
- **Bug Fixes:** Addressing known issues to improve app stability.
- **Feature Additions:**
  - Advanced notification system.
  - Enhanced user roles and permissions.
  - Analytics dashboard for tracking team performance.
  - Integration with third-party tools like Slack and Trello.

We are committed to making **TaskFlow** a robust and feature-complete platform. Feel free to contribute or report issues as we progress!

---

## 🚀 **Features at a Glance**

### ✅ **Current Features**
- **Task Creation:** Create and assign tasks with clear deadlines and priorities.
- **Team Collaboration:** Add team members and manage roles effectively.
- **Progress Tracking:** Visualize task stages for better productivity.
- **Responsive Design:** Works seamlessly on all devices, from desktops to mobile phones.

### 🛠️ **Upcoming Features**
- **Real-Time Chat:** Collaborate with team members directly within the platform.
- **Task Analytics:** Gain insights into task completion rates and team efficiency.
- **Dark Mode:** Switch between light and dark themes for user comfort.
- **File Attachments:** Upload and manage files directly in tasks.

---

## 📚 **Table of Contents**

1. [Technologies Used](#technologies-used)  
2. [Setup Instructions](#setup-instructions)  
   - [Prerequisites](#prerequisites)  
   - [Installation](#installation)  
3. [Running the Application](#running-the-application)  
4. [Known Issues](#known-issues)  
5. [API Documentation](#api-documentation)  
6. [Directory Structure](#directory-structure)  
7. [Contributing](#contributing)  
8. [License](#license)  

---

## 🛠️ **Technologies Used**

### Frontend
- **[React](https://reactjs.org/):** For building the user interface.
- **[Redux Toolkit](https://redux-toolkit.js.org/):** Simplified state management.
- **[React Router](https://reactrouter.com/):** Routing and navigation.
- **[Tailwind CSS](https://tailwindcss.com/):** A utility-first CSS framework for responsive design.
- **[Vite](https://vitejs.dev/):** Build tool optimized for modern web apps.

### Backend
- **[Node.js](https://nodejs.org/):** Backend runtime for JavaScript.
- **[Express](https://expressjs.com/):** Web framework for building APIs.
- **[MongoDB](https://www.mongodb.com/):** Database for storing tasks, users, and other data.
- **[Mongoose](https://mongoosejs.com/):** ODM library for MongoDB.
- **[JWT](https://jwt.io/):** Token-based authentication.
- **[Bcrypt](https://github.com/kelektiv/node.bcrypt.js/):** Password encryption.
- **[Socket.io](https://socket.io/):** Real-time communication.

---

## ⚙️ **Setup Instructions**

### Prerequisites
- **Node.js:** v14 or higher. [Download Node.js](https://nodejs.org/)  
- **MongoDB:** A running instance of MongoDB (local or cloud). [Get MongoDB](https://www.mongodb.com/)  

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/taskflow-web-app.git
   cd taskflow-web-app
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Variables:**
   Configure `.env` files in both `server/` and `client/` directories:  
   - Backend `.env`:
     ```env
     MONGODB_URL=<your_mongodb_connection_string>
     JWT_SECRET=<your_secret_key>
     CLIENT_URL=http://localhost:7000
     ```
   - Frontend `.env`:
     ```env
     VITE_BASE_URL=http://localhost:7007
     ```

---

## ▶️ **Running the Application**

1. **Start the Backend Server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the Frontend Client:**
   ```bash
   cd ../client
   npm run dev
   ```

3. **Access the App:**
   Open [http://localhost:7000](http://localhost:7000) in your browser.

---

## 🐞 **Known Issues**
- Some task statuses are not updating in real time.  
- Notifications occasionally fail to display.  
- Performance optimization required for large teams and datasets.  

We appreciate community feedback to resolve these issues. Please report bugs under the [Issues section](https://github.com/yourusername/taskflow-web-app/issues).

---

## 📂 **Directory Structure**

### Frontend
```
client/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Main application pages
│   ├── redux/             # State management setup
│   ├── utils/             # Utility functions
├── public/                # Static assets
├── tailwind.config.js     # TailwindCSS configuration
└── vite.config.js         # Vite configuration
```

### Backend
```
server/
├── models/                # Mongoose schemas
├── controllers/           # API logic
├── routes/                # Express route definitions
├── middlewares/           # Custom middleware
├── utils/                 # Helper functions
└── server.js              # Entry point
```

---

## 🤝 **Contributing**

We welcome contributions from the community!  

1. **Fork the repository.**  
2. **Create a feature branch:**  
   ```bash
   git checkout -b feature-name
   ```
3. **Commit changes:**  
   ```bash
   git commit -m "Description of changes"
   ```
4. **Submit a pull request** with a detailed description.

---

## 📜 **License**

This project is licensed under the [MIT License](LICENSE). Feel free to use and modify it as needed.

---

## 💬 **Support**

Have questions or feedback? Reach out via [GitHub Issues](https://github.com/iamrohitkandpal/taskflow-web-app/issues) or email us at `iamrohitkandpal@gmail.com`. 

---

