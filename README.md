# 🗳️ VoteWise - E-Voting System

**VoteWise** is a full-stack, secure, and intuitive e-voting platform designed to digitize and simplify elections. Built with a robust Java backend, a dynamic React frontend, and a highly scalable MongoDB database.

![VoteWise Banner](https://via.placeholder.com/1200x400.png?text=VoteWise+-+Secure+E-Voting)

## ✨ Features
* **Secure OTP Registration:** Sends genuine OTPs via email for user registration verification.
* **Voter Authentication:** CAPTCHA and encrypted password logins to eliminate bot activity.
* **Live Voting Mechanism:** One vote per user system with dynamic candidate databases.
* **Real-time Results:** Instantly view vote allocations via interactive UI.
* **Unified Full-Stack Deployment:** The React frontend is seamlessly merged with the Java backend, running perfectly as a single Dockerized container on Render!

---

## 📸 Screenshots

### 1️⃣ Registration & OTP Verification
> Users register their voter IDs and verifiable emails. The system dispatched a real SMTP Email with an OTP code.
> ![Registration Screenshot](https://via.placeholder.com/800x400.png?text=Add+Registration+Screenshot+Here)

### 2️⃣ Secure Login Dashboard
> Users undergo bot-checking via CAPTCHA to ensure integrity.
> ![Login Screenshot](https://via.placeholder.com/800x400.png?text=Add+Login+Screenshot+Here)

### 3️⃣ Voting Portal
> Select candidates from the dynamically populated database array.
> ![Voting Portal Screenshot](https://via.placeholder.com/800x400.png?text=Add+Voting+Portal+Screenshot+Here)

*(Note: Replace the placeholder URLs in this md file with your actual image paths once you take screenshots!)*

---

## 🚀 Live Deployment Guide (GitHub to Render)

Follow these exact steps to push your project online, with zero errors, fully merged frontend/backend, live MongoDB, and working OTP emails!

### Phase 1: Push Project to GitHub
1. **Initialize Git:** Open your terminal inside the `VoteWise` root folder.
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Merged Fullstack VoteWise"
   ```
2. **Push to your Repository:** Go to GitHub, create a new repository called `VoteWise`. Do **not** initialize it with a README. Copy the repository URL.
3. **Link and Push:**
   ```bash
   git branch -M main
   git remote add origin YOUR_REPOSITORY_URL_HERE
   git push -u origin main
   ```

### Phase 2: Deploy to Render
Render will host both your frontend and backend thanks to the unified `Dockerfile` we created.

1. Go to [Render.com](https://render.com) and sign in.
2. Click **New +** and select **Web Service**.
3. Choose **Build and deploy from a Git repository**, and connect the `VoteWise` repository you just created.
4. Set up the specific configurations:
   * **Name:** `votewise-live`
   * **Language:** `Docker` (Render will automatically detect the Dockerfile!)
   * **Branch:** `main`
   * **Instance Type:** Free (or any tier)

### Phase 3: Setup Environment Variables for Email & DB
In the Render Web Service settings, scroll down to **Environment Variables** and add the following:

| Key | Value | Description |
| --- | --- | --- |
| `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas Connection String (already set by default inside `DatabaseHelper.java` but putting it here is safer). |
| `SMTP_EMAIL` | `your.email@gmail.com` | The Google email address that will SEND the OTPs. |
| `SMTP_PASSWORD`| `xxyy xxyy xxyy xxyy` | Your Google **App Password** (See guide below). |

**How to get a Google App Password?**
1. Go to your Google Account -> **Security**.
2. Turn ON **2-Step Verification**.
3. Search for "App Passwords" in the Security search bar.
4. Create a new App Password (name it "VoteWise Render"), copy the 16-letter code, and paste it directly into `SMTP_PASSWORD` on Render. Spaces are fine.

5. **Deploy!** Click the `Deploy` button. Render will build the React Frontend, compile the Java Backend, and merge them statically to serve on port `8080`.

---

## ⚙️ Tech Stack
- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Core Java (JDK 17), `com.sun.net.httpserver`, `javax.mail`
- **Database:** MongoDB Atlas (Cloud)
- **Containerization:** Docker (Multi-stage build)

Happy Voting! 🇮🇳
