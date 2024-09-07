import { db } from "@/lib/db/db";
import { orders, products, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { use } from "react";

export async function GET() {
    // todo: add authentication
    // todo: add pagination
    // todo : add error handling
    // todo: add logging

    const allOrders = await db.select({
        id: orders.id,
        product: products.name,
        productId: orders.productId,
        userId: users.id,
        user: users.fname,
        type: orders.type,
        price: orders.price,
        image: products.image,
        status: orders.status,
        address: orders.address,
        qty: orders.qty,
        paymentId: orders.paymentId,
        createdAt: orders.createdAt,

    }).from(orders).leftJoin(products, eq(orders.productId, products.id)).leftJoin(users, eq(orders.userId, users.id)).orderBy(desc(orders.id));
    return Response.json(allOrders);
}