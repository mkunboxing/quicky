
import { db } from "@/lib/db/db";
import { deliveryPersons, inventories, orders } from "@/lib/db/schema";
import axios from "axios";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const paymentOrderId = searchParams.get("payment_OrderId");

  console.log("orderId", orderId, "paymentOrderId", paymentOrderId);

  if (!paymentOrderId) {
    return Response.json({ message: "Order ID is required", status: "FAILED" }, { status: 400 });
  }

  try {
    // const response = await axios.get(`https://sandbox.cashfree.com/pg/orders/${paymentOrderId}`, {
    const response = await axios.get(`https://api.cashfree.com/pg/orders/${paymentOrderId}`, {
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
      },
    });

    const { order_id } = response.data;
    console.log(response.data);
    console.log("Order ID:", order_id, "Payment Status:", response.data.order_status);
    let orderStatus = response.data.order_status;

    if (orderStatus === "PAID") {
      console.log("Payment verified successfully!");
      try {
        // update order
        await db.update(orders).set({ status: "PAID" }).where(eq(orders.paymentId, paymentOrderId));
        return Response.json({ message: "Payment verified successfully!", status: "PAID", orderId }, { status: 200 });
      } catch (err) {
        return Response.json({ message: "Failed to update order status", status: "FAILED", orderId }, { status: 500 });
      }
    } else {
      console.log("Payment failed, deleting order");
      try {
        // delivery persons update
        await db.update(deliveryPersons).set({orderId: sql`NULL`}).where(eq(deliveryPersons.orderId, Number(orderId)));
        // update inventory update
        await db.update(inventories).set({orderId: sql`NULL`}).where(eq(inventories.orderId, Number(orderId)));
        // delete order
        await db.delete(orders).where(eq(orders.id, Number(orderId)));

        return Response.json({ message: "Payment verification failed.", status: "FAILED", orderId }, { status: 200 });
      } catch (err) {
        return Response.json({ message: "Error processing failed payment", status: "FAILED", orderId }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return Response.json({ message: "Error verifying payment", status: "FAILED", orderId }, { status: 500 });
  }
}
