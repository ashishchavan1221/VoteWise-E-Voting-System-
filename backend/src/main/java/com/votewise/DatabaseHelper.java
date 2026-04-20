package com.votewise;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.MongoCollection;
import org.bson.Document;

public class DatabaseHelper {
    private static final String DEFAULT_CONNECTION_STRING = "mongodb+srv://ashishchavan:ashish1221@cluster0.ucix1wi.mongodb.net/?retryWrites=true&w=majority";
    private static MongoClient mongoClient = null;
    private static MongoDatabase database = null;

    public static void connect() {
        if (mongoClient == null) {
            String connectionString = System.getenv("MONGO_URI");
            if (connectionString == null || connectionString.isEmpty()) {
                connectionString = DEFAULT_CONNECTION_STRING;
            }
            System.out.println("Connecting to MongoDB...");
            mongoClient = MongoClients.create(connectionString);
            database = mongoClient.getDatabase("votewise");
            System.out.println("Successfully connected to MongoDB!");
        }
    }

    public static MongoCollection<Document> getUsersCollection() {
        if (database == null) connect();
        return database.getCollection("users");
    }

    public static MongoCollection<Document> getCandidatesCollection() {
        if (database == null) connect();
        return database.getCollection("candidates");
    }

    public static MongoCollection<Document> getOtpCollection() {
        if (database == null) connect();
        return database.getCollection("otps");
    }

    public static MongoCollection<Document> getCaptchaCollection() {
        if (database == null) connect();
        return database.getCollection("captchas");
    }
}
