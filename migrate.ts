import { connection, db } from "@/lib/db/db"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { connect } from "http2"

(async ()=>{
    await migrate(db, { migrationsFolder: './drizzle'})
    await connection.end()
})()