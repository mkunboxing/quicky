import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const queryString = process.env.DATABASE_URL as string;
export const connection = postgres(queryString);


export const db = drizzle(connection);

// Test the connection
async function testConnection() {
    try {
      const result = await connection`SELECT NOW()`;
      console.log('Connection successful:', result);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  }
  
  testConnection();