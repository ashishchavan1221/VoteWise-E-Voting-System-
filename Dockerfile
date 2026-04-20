# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend-react

# Copy package files and install dependencies
COPY frontend-react/package*.json ./
RUN npm install

# Copy all source files and build
COPY frontend-react/ ./
RUN npm run build

# ==========================================
# Stage 2: Final Environment (Maven for Backend)
# ==========================================
FROM maven:3.9.6-eclipse-temurin-17
WORKDIR /app/backend

# Copy backend source
COPY backend/pom.xml .
RUN mvn dependency:go-offline
COPY backend/src ./src
RUN mvn clean compile

# Create directory over at /app for frontend and copy the built react dist
WORKDIR /app
COPY --from=frontend-builder /app/frontend-react/dist /app/frontend-react/dist

# Set working directory back to backend for execution
WORKDIR /app/backend

EXPOSE 8080

# Start server using maven
CMD ["mvn", "exec:java", "-Dexec.mainClass=com.votewise.Main"]
