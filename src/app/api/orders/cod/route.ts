import { authOptions } from "@/lib/auth/authOptions";
import { db } from "@/lib/db/db";
import { deliveryPersons, inventories, orders } from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";

/**
 * POST /api/orders/cod
 * Called when the user selects "Cash on Delivery" after payment failure.
 * Assigns a delivery person and marks the order as COD.
 *
 * Body: { orderId: number }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ message: "Not allowed" }, { status: 401 });
  }

  let orderId: number;
  try {
    const body = await request.json();
    orderId = Number(body.orderId);
    if (!orderId || isNaN(orderId)) throw new Error("Invalid orderId");
  } catch {
    return Response.json({ message: "orderId is required" }, { status: 400 });
  }

  try {
    // Get warehouse from the reserved inventory for this order
    const inventoryRow = await db
      .select({ warehouseId: inventories.warehouseId })
      .from(inventories)
      .where(eq(inventories.orderId, orderId))
      .limit(1);

    if (!inventoryRow.length || !inventoryRow[0].warehouseId) {
      return Response.json({ message: "Order inventory not found" }, { status: 404 });
    }

    const warehouseId = inventoryRow[0].warehouseId;

    await db.transaction(async (tx) => {
      // Lock and pick a free delivery person
      const availablePerson = await tx
        .select()
        .from(deliveryPersons)
        .where(and(isNull(deliveryPersons.orderId), eq(deliveryPersons.warehouseId, warehouseId)))
        .for("update")
        .limit(1);

      if (!availablePerson.length) {
        throw new Error("No delivery person available");
      }

      // Assign delivery person
      await tx
        .update(deliveryPersons)
        .set({ orderId })
        .where(eq(deliveryPersons.id, availablePerson[0].id));

      // Mark order as COD
      await tx.update(orders).set({ status: "cod" }).where(eq(orders.id, orderId));
    });

    return Response.json(
      { message: "Cash on Delivery confirmed. Delivery person assigned.", status: "cod" },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("COD assignment error:", err);
    return Response.json({ message: err.message || "Failed to confirm COD" }, { status: 500 });
  }
}

/**
 * DELETE /api/orders/cod
 * Called when the user declines COD after payment failure.
 * Releases reserved stock and deletes the order.
 *
 * Body: { orderId: number }
 */
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.json({ message: "Not allowed" }, { status: 401 });
  }

  let orderId: number;
  try {
    const body = await request.json();
    orderId = Number(body.orderId);
    if (!orderId || isNaN(orderId)) throw new Error("Invalid orderId");
  } catch {
    return Response.json({ message: "orderId is required" }, { status: 400 });
  }

  try {
    // Release inventory (clear the orderId link)
    await db.update(inventories).set({ orderId: sql`NULL` }).where(eq(inventories.orderId, orderId));
    // Delete the order
    await db.delete(orders).where(eq(orders.id, orderId));

    return Response.json({ message: "Order cancelled and stock released." }, { status: 200 });
  } catch (err: any) {
    console.error("Order cancel error:", err);
    return Response.json({ message: "Failed to cancel order" }, { status: 500 });
  }
}
