import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const queryString = process.env.DATABASE_URL as string;
export const connection = postgres(queryString);


export const db = drizzle(connection);
