FROM maven:3.9.6-eclipse-temurin-17
WORKDIR /app

# Copy pom.xml and download dependencies first (caching)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the actual source code and compile
COPY src ./src
RUN mvn clean compile

# Render provides the PORT auto-magically
EXPOSE 8080

# Start the server using Maven exec
CMD ["mvn", "exec:java", "-Dexec.mainClass=com.votewise.Main"]
