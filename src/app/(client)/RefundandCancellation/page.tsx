import React from "react";

const CancellationRefundPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Cancellation & Refund Policy</h1>
      <p className="text-sm text-gray-500 mb-6">
        Last updated on 06-09-2024
      </p>

      <p className="mb-4">
        <strong>MUKUL KUMAR</strong> believes in helping its customers as far as possible, and has therefore adopted a liberal cancellation policy. Under this policy:
      </p>

      <ul className="list-disc list-inside mb-4 space-y-2">
        <li>
          Cancellations will be considered only if the request is made
          immediately after placing the order. However, the cancellation request
          may not be entertained if the orders have been communicated to the
          vendors/merchants and they have initiated the process of shipping
          them.
        </li>
        <li>
          <strong>MUKUL KUMAR</strong> does not accept cancellation requests for
          perishable items like flowers, eatables, etc. However, refund or
          replacement can be made if the customer establishes that the quality
          of the product delivered is not good.
        </li>
        <li>
          In case of receipt of damaged or defective items, please report the
          same to our Customer Service team. The request will, however, be
          entertained once the merchant has checked and determined the same at
          their own end. This should be reported within 2 days of receipt of the
          products. In case you feel that the product received is not as shown
          on the site or as per your expectations, you must bring it to the
          notice of our customer service within 2 days of receiving the product.
          The Customer Service Team, after looking into your complaint, will
          take an appropriate decision.
        </li>
        <li>
          In case of complaints regarding products that come with a warranty
          from manufacturers, please refer the issue to them.
        </li>
        <li>
          In case of any refunds approved by <strong>MUKUL KUMAR</strong>, it’ll
          take 6-8 days for the refund to be processed to the end customer.
        </li>
      </ul>
    </div>
  );
};

export default CancellationRefundPolicy;
