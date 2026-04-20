@echo off
echo ==============================================
echo      Starting VoteWise Servers...
echo ==============================================

echo Starting Pure Java Backend (Port 8080)...
start "VoteWise Backend (Java)" cmd /k "cd backend && title VoteWise Backend && mvn clean compile exec:java -Dexec.mainClass=""com.votewise.Main"""

echo Starting React Frontend (Port 5173)...
start "VoteWise Frontend (React)" cmd /k "cd frontend-react && title VoteWise Frontend && npm run dev"

echo ==============================================
echo Both servers are launching in separate windows!
echo - Keep those windows open to keep the servers running.
echo - Close the specific windows when you want to stop them.
echo ==============================================
pause
