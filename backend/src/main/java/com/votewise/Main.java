package com.votewise;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import com.votewise.util.SecurityUtil;
import org.bson.Document;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class Main {

    public static void main(String[] args) throws IOException {
        DatabaseHelper.connect();
        String envPort = System.getenv("PORT");
        int port = (envPort != null && !envPort.isEmpty()) ? Integer.parseInt(envPort) : 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Security / Auth Routes
        server.createContext("/api/auth/register-init", new RegisterInitHandler());
        server.createContext("/api/auth/register-verify", new RegisterVerifyHandler());
        server.createContext("/api/auth/captcha", new CaptchaHandler());
        server.createContext("/api/auth/login", new LoginHandler());
        
        // Voting Routes
        server.createContext("/api/candidates", new CandidatesHandler());
        server.createContext("/api/vote", new VoteHandler());
        server.createContext("/api/vote/check", new VoteCheckHandler());
        server.createContext("/api/vote/results", new ResultsHandler());

        // Health Check / Static File Route for React
        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }
            
            // Serve static files from React build directory (assumed to be in /app/frontend-react/dist or local)
            java.io.File file = new java.io.File("../frontend-react/dist" + path);
            if (!file.exists()) {
                file = new java.io.File("frontend-react/dist" + path); // Try alternate path
                if (!file.exists()) {
                    file = new java.io.File("dist" + path); // Try Docker build path
                }
            }

            if (file.exists() && !file.isDirectory()) {
                String mime = "text/plain";
                if (path.endsWith(".html")) mime = "text/html";
                else if (path.endsWith(".js")) mime = "application/javascript";
                else if (path.endsWith(".css")) mime = "text/css";
                else if (path.endsWith(".png")) mime = "image/png";
                else if (path.endsWith(".jsx")) mime = "application/javascript";
                else if (path.endsWith(".svg")) mime = "image/svg+xml";

                exchange.getResponseHeaders().add("Content-Type", mime);
                exchange.sendResponseHeaders(200, file.length());
                OutputStream os = exchange.getResponseBody();
                java.nio.file.Files.copy(file.toPath(), os);
                os.close();
            } else if (path.startsWith("/api/")) {
                String resp = "{\"status\": \"API Route not found!\"}";
                exchange.getResponseHeaders().add("Content-Type", "application/json");
                exchange.sendResponseHeaders(404, resp.length());
                OutputStream os = exchange.getResponseBody();
                os.write(resp.getBytes());
                os.close();
            } else {
                // Return index.html for client side routing
                java.io.File indexFile = new java.io.File("../frontend-react/dist/index.html");
                if (!indexFile.exists()) indexFile = new java.io.File("frontend-react/dist/index.html");
                if (!indexFile.exists()) indexFile = new java.io.File("dist/index.html");
                
                if (indexFile.exists()) {
                    exchange.getResponseHeaders().add("Content-Type", "text/html");
                    exchange.sendResponseHeaders(200, indexFile.length());
                    OutputStream os = exchange.getResponseBody();
                    java.nio.file.Files.copy(indexFile.toPath(), os);
                    os.close();
                } else {
                    String resp = "{\"status\": \"VoteWise API is completely live and healthy! (Frontend not found)\"}";
                    exchange.getResponseHeaders().add("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, resp.length());
                    OutputStream os = exchange.getResponseBody();
                    os.write(resp.getBytes());
                    os.close();
                }
            }
        });

        server.setExecutor(null);
        System.out.println("Secure Backend Server is running on http://localhost:" + port);
        server.start();
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, Origin, X-Requested-With");
        exchange.getResponseHeaders().set("Access-Control-Max-Age", "86400");

        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            // Strictly returning 200 OK because many browsers crash on 204 No Content for OPTIONS preflights.
            exchange.sendResponseHeaders(200, 0);
            OutputStream os = exchange.getResponseBody();
            os.write(new byte[0]);
            os.close();
            return;
        }

        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    }

    // 1. Initialize Registration (Sends OTP)
    static class RegisterInitHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendResponse(exchange, 204, ""); return; }
            if (!"POST".equals(exchange.getRequestMethod())) { sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}"); return; }
            try {
                String body = readRequestBody(exchange);
                JSONObject json = new JSONObject(body);

                String voterId = json.optString("voterId");
                
                Document existing = DatabaseHelper.getUsersCollection().find(new Document("voterId", voterId)).first();
                if (existing != null) {
                    sendResponse(exchange, 400, "{\"error\": \"Voter ID already registered!\"}");
                    return;
                }

                String otp = SecurityUtil.generateOTP();
                
                // SEND REAL EMAIL
                String email = json.optString("email");
                System.out.println("\n--- Attempting to send OTP Email to: " + email + " ---");
                SecurityUtil.sendEmail(email, "VoteWise E-Voting Registration OTP", "Your VoteWise Registration OTP is: " + otp + "\n\nPlease do not share this code with anyone.");

                Document tempOtpDoc = new Document("voterId", voterId)
                        .append("otp", otp)
                        .append("name", json.optString("name"))
                        .append("password", json.optString("password"))
                        .append("college", json.optString("college"))
                        .append("email", email)
                        .append("age", json.optInt("age"));
                
                // Wipe any old attempts and insert new
                DatabaseHelper.getOtpCollection().deleteMany(new Document("voterId", voterId));
                DatabaseHelper.getOtpCollection().insertOne(tempOtpDoc);

                sendResponse(exchange, 200, "{\"status\": \"pending\", \"message\": \"OTP Sent to Email and Phone\"}");
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\": \"Internal Server Error\"}");
            }
        }
    }

    // 2. Verify Registration (Validates OTP & Saves User with Hashed Password)
    static class RegisterVerifyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendResponse(exchange, 204, ""); return; }
            if (!"POST".equals(exchange.getRequestMethod())) { sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}"); return; }
            try {
                JSONObject json = new JSONObject(readRequestBody(exchange));
                String voterId = json.optString("voterId");
                String enteredOtp = json.optString("otp");

                Document otpRecord = DatabaseHelper.getOtpCollection().find(new Document("voterId", voterId)).first();
                
                if (otpRecord == null || !otpRecord.getString("otp").equals(enteredOtp)) {
                    sendResponse(exchange, 400, "{\"error\": \"Invalid or Expired OTP!\"}");
                    return;
                }

                // Hash password & save user
                String hashedPassword = SecurityUtil.hashPassword(otpRecord.getString("password"));
                
                Document newUser = new Document("voterId", voterId)
                        .append("name", otpRecord.getString("name"))
                        .append("password", hashedPassword)
                        .append("college", otpRecord.getString("college"))
                        .append("email", otpRecord.getString("email"))
                        .append("age", otpRecord.getInteger("age"))
                        .append("hasVoted", false);
                
                DatabaseHelper.getUsersCollection().insertOne(newUser);
                DatabaseHelper.getOtpCollection().deleteOne(new Document("voterId", voterId)); // Clean up

                sendResponse(exchange, 201, "{\"status\": \"success\", \"message\": \"Registered Successfully\"}");
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\": \"Internal Server Error\"}");
            }
        }
    }

    // 3. Captcha Generator
    static class CaptchaHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendResponse(exchange, 204, ""); return; }
            try {
                String captchaId = SecurityUtil.generateUUID();
                String text = SecurityUtil.generateCaptchaText();

                DatabaseHelper.getCaptchaCollection().insertOne(new Document("captchaId", captchaId).append("text", text));

                JSONObject response = new JSONObject();
                response.put("captchaId", captchaId);
                response.put("text", text);
                sendResponse(exchange, 200, response.toString());
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"Internal Server Error\"}");
            }
        }
    }

    // 4. Secure Login (Checks CAPTCHA, then hashes input to match DB)
    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendResponse(exchange, 204, ""); return; }
            if (!"POST".equals(exchange.getRequestMethod())) { sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}"); return; }
            
            try {
                JSONObject json = new JSONObject(readRequestBody(exchange));
                String voterId = json.optString("voterId");
                String password = json.optString("password");
                String captchaId = json.optString("captchaId");
                String captchaAnswer = json.optString("captchaAnswer");

                // Verify Captcha
                Document captchaDoc = DatabaseHelper.getCaptchaCollection().find(new Document("captchaId", captchaId)).first();
                if (captchaDoc == null || !captchaDoc.getString("text").equalsIgnoreCase(captchaAnswer)) {
                    sendResponse(exchange, 400, "{\"error\": \"Invalid CAPTCHA! Please try again.\"}");
                    return;
                }
                DatabaseHelper.getCaptchaCollection().deleteOne(new Document("captchaId", captchaId)); // Destroy after use

                // Verify Password
                String hashedPassword = SecurityUtil.hashPassword(password);
                Document user = DatabaseHelper.getUsersCollection().find(
                        new Document("voterId", voterId).append("password", hashedPassword)
                ).first();

                if (user != null) {
                    JSONObject success = new JSONObject();
                    success.put("voterId", voterId);
                    success.put("token", SecurityUtil.generateUUID()); // Mock JWT
                    success.put("name", user.getString("name"));
                    sendResponse(exchange, 200, success.toString());
                } else {
                    sendResponse(exchange, 401, "{\"error\": \"Invalid Voter ID or Password\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\": \"Internal Server Error\"}");
            }
        }
    }

    // 5. Fetch 10 Candidates
    static class CandidatesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendResponse(exchange, 204, ""); return; }
            
            try {
                List<Document> candidates = DatabaseHelper.getCandidatesCollection().find().into(new ArrayList<>());
                
                if (candidates.isEmpty()) {
                    System.out.println("Database empty. Supplying 10 default candidates...");
                    Object[][] defaults = {
                        {1, "Rahul Sharma", "Student Union", "Better policies", "🦁"},
                        {2, "Priya Patel", "Tech Innovators", "Free Campus Wi-Fi 6", "🦅"},
                        {3, "Amit Singh", "Arts Guild", "More creative funds", "🐘"},
                        {4, "Sneha Reddy", "Sports Club", "New stadium equipment", "🐯"},
                        {5, "Karan Malhotra", "Science Core", "Better lab setups", "🦉"},
                        {6, "Neha Gupta", "Debate Society", "Weekly events", "🐎"},
                        {7, "Ravi Kumar", "Music Band", "Music festival every month", "🐬"},
                        {8, "Anjali Verma", "Dance Troupe", "New studio space", "🐻"},
                        {9, "Vikram Das", "Photography Club", "Free DSLR rentals", "🐢"},
                        {10, "Pooja Desai", "Environment Society", "Green campus initiative", "🐺"}
                    };
                    
                    for (Object[] c : defaults) {
                        DatabaseHelper.getCandidatesCollection().insertOne(new Document("id", (Integer)c[0])
                            .append("name", (String)c[1])
                            .append("party_or_group", (String)c[2])
                            .append("manifesto", (String)c[3])
                            .append("symbol", (String)c[4])
                            .append("votes", 0));
                    }
                    candidates = DatabaseHelper.getCandidatesCollection().find().into(new ArrayList<>());
                }

                JSONArray array = new JSONArray();
                for (Document doc : candidates) {
                    JSONObject obj = new JSONObject();
                    obj.put("id", doc.getInteger("id"));
                    obj.put("name", doc.getString("name"));
                    obj.put("party_or_group", doc.getString("party_or_group"));
                    obj.put("manifesto", doc.getString("manifesto"));
                    obj.put("symbol", doc.getString("symbol"));
                    obj.put("votes", doc.getInteger("votes", 0));
                    array.put(obj);
                }
                sendResponse(exchange, 200, array.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\": \"Internal error\"}");
            }
        }
    }

    // 6. Cast Vote
    static class VoteHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendResponse(exchange, 204, ""); return; }
            if (!"POST".equals(exchange.getRequestMethod())) { sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}"); return; }
            
            try {
                JSONObject json = new JSONObject(readRequestBody(exchange));
                String voterId = json.optString("voterId");
                int candidateId = json.optInt("candidateId");

                Document user = DatabaseHelper.getUsersCollection().find(new Document("voterId", voterId)).first();
                if (user == null) {
                    sendResponse(exchange, 400, "{\"error\": \"User not found!\"}");
                    return;
                }
                if (user.getBoolean("hasVoted", false)) {
                    sendResponse(exchange, 400, "{\"error\": \"Vote already cast. Cannot vote twice.\"}");
                    return;
                }

                // Increment candidate votes
                DatabaseHelper.getCandidatesCollection().updateOne(
                    new Document("id", candidateId),
                    new Document("$inc", new Document("votes", 1))
                );

                // Mark user as voted
                DatabaseHelper.getUsersCollection().updateOne(
                    new Document("voterId", voterId),
                    new Document("$set", new Document("hasVoted", true))
                );

                sendResponse(exchange, 201, "{\"status\": \"success\"}");
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\": \"Internal Server Error\"}");
            }
        }
    }

    // 7. Check Vote Status
    static class VoteCheckHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendResponse(exchange, 204, ""); return; }
            if (!"POST".equals(exchange.getRequestMethod())) { sendResponse(exchange, 405, "{\"error\": \"Method not allowed\"}"); return; }
            
            try {
                JSONObject json = new JSONObject(readRequestBody(exchange));
                String voterId = json.optString("voterId");

                Document user = DatabaseHelper.getUsersCollection().find(new Document("voterId", voterId)).first();
                boolean voted = user != null && user.getBoolean("hasVoted", false);

                sendResponse(exchange, 200, "{\"voted\": " + voted + "}");
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"Internal Server Error\"}");
            }
        }
    }

    // 8. Results Handler
    static class ResultsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) { sendResponse(exchange, 204, ""); return; }
            
            try {
                List<Document> candidates = DatabaseHelper.getCandidatesCollection().find().into(new ArrayList<>());
                // Sort by votes descending
                candidates.sort((d1, d2) -> {
                    Number v1 = (Number) d1.get("votes");
                    Number v2 = (Number) d2.get("votes");
                    int i1 = (v1 != null) ? v1.intValue() : 0;
                    int i2 = (v2 != null) ? v2.intValue() : 0;
                    return Integer.compare(i2, i1);
                });
                
                JSONArray array = new JSONArray();
                for (Document doc : candidates) {
                    JSONObject obj = new JSONObject();
                    obj.put("id", doc.getInteger("id"));
                    obj.put("name", doc.getString("name"));
                    obj.put("votes", doc.getInteger("votes", 0));
                    array.put(obj);
                }
                sendResponse(exchange, 200, array.toString());
            } catch (Exception e) {
                sendResponse(exchange, 500, "{\"error\": \"Internal Server Error\"}");
            }
        }
    }
}
