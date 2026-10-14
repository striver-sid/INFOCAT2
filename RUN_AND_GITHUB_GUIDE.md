# 🚀 CipherMail — Local Run & GitHub Push Guide

This guide provides step-by-step instructions for running the **CipherMail** frontend and backend locally, executing the test suite, and pushing the codebase to your GitHub repository.

---

## 📋 1. Prerequisites

Before running the project, ensure you have the following installed on your machine:
- **Node.js**: v20.0.0 or higher (v22+ recommended). Check with:
  ```bash
  node -v
  ```
- **npm**: v10.0.0 or higher. Check with:
  ```bash
  npm -v
  ```
- **Git**: Installed and configured with your name and email:
  ```bash
  git --version
  git config --global user.name "Your Name"
  git config --global user.email "your-email@example.com"
  ```

---

## ⚙️ 2. Environment Configuration

CipherMail includes `.env.example` templates for both the server and client.

### Backend Environment Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Create your `.env` file from the example template:
   - **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - **Windows (CMD)**:
     ```cmd
     copy .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```
3. Return to root:
   ```bash
   cd ..
   ```

### Frontend Environment Setup
1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Create your `.env` file from the example template:
   - **Windows (PowerShell)**:
     ```powershell
     Copy-Item .env.example .env
     ```
   - **Windows (CMD)**:
     ```cmd
     copy .env.example .env
     ```
   - **macOS / Linux**:
     ```bash
     cp .env.example .env
     ```
3. Return to root:
   ```bash
   cd ..
   ```

---

## 📦 3. Dependency Installation

Install dependencies for the root orchestrator, backend server, and frontend client:

### Option A: Install Everything from Root
```bash
# Install root process manager dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Install frontend dependencies
cd client && npm install && cd ..
```

---

## 🏃 4. Running the Application

### Method 1: Dual-Boot from Root (Recommended)
You can run both the frontend (Vite) and backend (Express) concurrently with a single command from the project root:

```bash
npm run dev
```

This starts:
- 📡 **Backend Server**: [http://localhost:5000](http://localhost:5000)
- 💻 **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- 🩺 **Health Telemetry**: [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)

Press `Ctrl + C` in the terminal to stop both servers simultaneously.

---

### Method 2: Running in Separate Terminals (For Debugging)

If you prefer separate logs for frontend and backend:

#### Terminal 1 — Backend API Server
```bash
cd server
npm run dev
```
*(Server listens on port 5000 with nodemon auto-reloading)*

#### Terminal 2 — Frontend Client
```bash
cd client
npm run dev
```
*(Vite dev server starts on port 5173 with instant Hot Module Replacement)*

---

## 🧪 5. Running Automated Tests & Production Build

### Run the Backend Test Suite (103 Tests)
CipherMail includes 103 automated tests covering all 4 cipher algorithms, database constraints, message lifecycle, status patching, and deletion.

From the project root:
```bash
npm run test:server
```
Or directly inside the `server/` directory:
```bash
cd server
npm test
```

### Validate Production Build
To verify that the frontend bundles cleanly without compilation errors:
```bash
cd client
npm run build
```

---

## 🐙 6. How to Push the Code to GitHub

Your local git repository is already configured with your GitHub remote origin:  
`https://github.com/striver-sid/INFOCAT2.git`

Follow these terminal commands from the project root (`e:\Semester9\InfoSecurityLab\InfoCat_2`):

### Step 1: Check Git Status
Check what files are ready to be staged:
```bash
git status
```
*(Notice that `node_modules`, `.env`, and local `.db` files are automatically excluded by `.gitignore`)*

### Step 2: Stage All Changes
Add all code, documentation, tests, and configuration files to the git staging area:
```bash
git add .
```

### Step 3: Create a Descriptive Commit
Commit the staged files with an informative message:
```bash
git commit -m "feat: complete CipherMail messaging system with classical ciphers, dashboard, and lab guide"
```

### Step 4: Ensure the Branch is Named `main`
```bash
git branch -M main
```

### Step 5: Verify Remote URL
Verify that your remote origin points to your GitHub repository:
```bash
git remote -v
```
If `origin` is not set or needs to be set, run:
```bash
git remote add origin https://github.com/striver-sid/INFOCAT2.git
```

### Step 6: Push to GitHub
Push your local `main` branch to GitHub:
```bash
git push -u origin main
```

> [!NOTE]
> **GitHub Authentication**:
> If GitHub asks for your credentials:
> 1. **Username**: Your GitHub username (`striver-sid`).
> 2. **Password**: Use a **Personal Access Token (Classic)** with the `repo` scope (GitHub no longer accepts account passwords for git pushes).  
> To generate a token: Go to GitHub → **Settings** → **Developer Settings** → **Personal Access Tokens** → **Tokens (classic)** → **Generate new token** → check `repo` scope → Copy token.

---

## 🔄 7. Future Updates (How to Push New Changes)

Whenever you make new modifications in the future, push them with these 3 quick commands:

```bash
git add .
git commit -m "docs: update lab demonstration notes"
git push
```

---

## 🛠️ 8. Troubleshooting Common Issues

### Issue 1: `Port 5000 or 5173 already in use`
If a previous process is still holding port 5000 or 5173 on Windows:
```powershell
# Find process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Find process on port 5173
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

### Issue 2: `git push rejected (non-fast-forward)`
If the remote GitHub repository already contains commits (e.g., a default README or license):
```bash
git pull --rebase origin main
git push origin main
```

### Issue 3: Missing `.env` Error
If the server reports missing environment variables, verify that `server/.env` exists and contains:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DB_PATH=./data/ciphermail.db
API_PREFIX=/api/v1
```
And that `client/.env` contains:
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```
