
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return Response.json({ message: "Order ID is required" }, { status: 400 });
  }

  try {
    const response = await axios.get(`https://sandbox.cashfree.com/pg/orders/${orderId}`, {
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
      },
    });

    const { payment_status, cf_order_id } = response.data;
    console.log(response.data);
    console.log("Order ID:", cf_order_id, "Payment Status:", response.data.order_status);

    // Return the JSON response from the server
    if (response.data.order_status === "PAID") {
      return new Response(
        JSON.stringify({ message: "Payment verified successfully!", orderId: cf_order_id, status: payment_status }),
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ message: "Payment verification failed.", orderId: cf_order_id, status: payment_status }),
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ message: "Error verifying payment" }), { status: 500 });
  }
}
