
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return Response.json({ message: "Order ID is required" }, { status: 400 });
  }

  try {
    const options = {
      method: "GET",
      url: `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      headers: {
        accept: "application/json",
        "x-api-version": "2022-09-01",
        "x-client-id": `${process.env.CASHFREE_APP_ID}`,
        "x-client-secret": `${process.env.CASHFREE_SECRET_KEY}`,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        console.log(response.data);
        console.log(response.data.data.cf_order_id);
        console.log(response.data.cf_order_id);
        if (response.data.payment_status === "PAID") {
          return Response.redirect("http://localhost:3000/success");
        }else{
          return Response.redirect("http://localhost:3000/failure");
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  } catch (error) {
    return Response.json({ message: "Error verifying payment" }, { status: 500 });
  }
}
