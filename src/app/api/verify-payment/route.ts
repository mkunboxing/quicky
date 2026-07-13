
import { db } from "@/lib/db/db";
import { deliveryPersons, inventories, orders } from "@/lib/db/schema";
import axios from "axios";
import { and, eq, isNull } from "drizzle-orm";


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const paymentOrderId = searchParams.get("payment_OrderId");

  console.log("orderId", orderId, "paymentOrderId", paymentOrderId);

  if (!paymentOrderId) {
    return Response.json({ message: "Order ID is required", status: "FAILED" }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://sandbox.cashfree.com/pg/orders/${paymentOrderId}`, {
    // const response = await axios.get(`https://api.cashfree.com/pg/orders/${paymentOrderId}`, {
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
      console.log("Payment verified successfully — assigning delivery person...");
      try {
        // Find the order to get its warehouse via the inventory
        const orderRows = await db
          .select({ id: orders.id })
          .from(orders)
          .where(eq(orders.paymentId, paymentOrderId))
          .limit(1);

        if (!orderRows.length) {
          return Response.json({ message: "Order not found", status: "FAILED" }, { status: 404 });
        }

        const internalOrderId = orderRows[0].id;

        // Get the warehouse linked to this order via inventory
        const inventoryRow = await db
          .select({ warehouseId: inventories.warehouseId })
          .from(inventories)
          .where(eq(inventories.orderId, internalOrderId))
          .limit(1);

        if (!inventoryRow.length || !inventoryRow[0].warehouseId) {
          return Response.json({ message: "Could not determine warehouse for order", status: "FAILED" }, { status: 500 });
        }

        const warehouseId = inventoryRow[0].warehouseId;

        // Assign a free delivery person from the same warehouse
        await db.transaction(async (tx) => {
          const availablePerson = await tx
            .select()
            .from(deliveryPersons)
            .where(and(isNull(deliveryPersons.orderId), eq(deliveryPersons.warehouseId, warehouseId)))
            .for("update")
            .limit(1);

          if (!availablePerson.length) {
            throw new Error("No delivery person available");
          }

          await tx
            .update(deliveryPersons)
            .set({ orderId: internalOrderId })
            .where(eq(deliveryPersons.id, availablePerson[0].id));

          // Update order status to PAID
          await tx.update(orders).set({ status: "PAID" }).where(eq(orders.id, internalOrderId));
        });

        return Response.json(
          { message: "Payment verified and delivery person assigned!", status: "PAID", orderId },
          { status: 200 }
        );
      } catch (err: any) {
        console.error("Error assigning delivery person:", err);
        return Response.json({ message: err.message || "Failed to assign delivery person", status: "FAILED", orderId }, { status: 500 });
      }
    } else {
      // Payment not completed (ACTIVE, EXPIRED, etc.)
      // Do NOT delete the order or release inventory here.
      // The client will show the COD popup:
      //   → User chooses COD  : POST /api/orders/cod  → assigns delivery person
      //   → User cancels      : DELETE /api/orders/cod → releases stock & deletes order
      console.log("Payment not completed. Order kept in 'reserved' state for COD dialog.");

      // Mark order to reflect payment failure (keeps the order alive)
      if (orderId) {
        try {
          await db.update(orders).set({ status: "payment_failed" }).where(eq(orders.id, Number(orderId)));
        } catch (_) { /* non-fatal */ }
      }

      return Response.json(
        { message: "Payment not completed. Choose Cash on Delivery or cancel.", status: "FAILED", orderId },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return Response.json({ message: "Error verifying payment", status: "FAILED", orderId }, { status: 500 });
  }
}
