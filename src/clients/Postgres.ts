import { Client } from "postgres";

export class DatabaseClient {
    private static instance = new Client({
        user: Deno.env.get("DB_USER"),
        password: Deno.env.get("DB_PASSWORD"),
        database: Deno.env.get("DB_NAME"),
        hostname: Deno.env.get("DB_HOST"),
        port: parseInt(Deno.env.get("DB_PORT") || "5432"),
    })
    
    private constructor() {}

    public static getInstance() {
        return this.instance;
    }
}