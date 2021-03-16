package com.laioffer.job.db;

public class MySQLDBUtil {
    private static final String INSTANCE = "laiproject-instance.cpqh9odayqyu.us-east-2.rds.amazonaws.com";
    private static final String PORT_NUM = "3306";
    public static final String DB_NAME = "laiproject";
    private static final String USERNAME = "admin";
    private static final String PASSWORD = "BLn6ZX9c3af6qee";
    // For better security, use an environment variable instead
    // private static final String PASSWORD = getEnv("my-db-password");
    public static final String URL = "jdbc:mysql://"
            + INSTANCE + ":" + PORT_NUM + "/" + DB_NAME
            + "?user=" + USERNAME + "&password=" + PASSWORD
            + "&autoReconnect=true&serverTimezone=UTC";
}
