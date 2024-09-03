import { Cashfree } from "cashfree-pg";
import axios from "axios";

Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return Response.json({ message: 'Order ID is required' }, { status: 400 });
  }

  try {
    const options = {
      method: 'GET',
      url: `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      headers: {
        accept: 'application/json',
        'x-api-version': '2022-09-01',
        'x-client-id': `${process.env.CASHFREE_APP_ID}`,
        'x-client-secret': `${process.env.CASHFREE_SECRET_KEY}`,
      },
    };

    const response = await axios.request(options);
    const data = response.data;

    // Assuming `data` has the payment information
    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error("Failed to verify payment:", error);
    return Response.json({ message: 'Failed to verify payment' }, { status: 500 });
  }
}