"use client";
import { GetOrder, getSingleProduct, placeOrder } from "@/http/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Header from "../../_components/header";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Star, Loader2 } from "lucide-react"; // Import Loader2 for spinner
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { orderSchema } from "@/lib/validators/orderSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
// @ts-ignore
import { load } from "@cashfreepayments/cashfree-js";
import axios, { AxiosError } from "axios";

type CustomError = {
  message: string;
};

type FormValues = z.infer<typeof orderSchema>;

const SingleProduct = () => {
  const param = useParams();
  const { toast } = useToast();
  const { data: session } = useSession();
  const pathname = usePathname();

  let orderId = "";
  let cashfree: any;

  const [paymentSessionId, setPaymentSessionId] = useState("");
  const [isProductAvailable, setIsProductAvailable] = useState(true);
  const [showBuyNow, setShowBuyNow] = useState(false);

  const { data: product, isLoading: isProductLoading } = useQuery({
    queryKey: ["product", param.id],
    queryFn: () => getSingleProduct(param.id as string),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      address: "",
      pincode: "",
      qty: 1,
      productId: Number(param.id),
    },
  });

  const qty = form.watch("qty");
  const price = React.useMemo(() => {
    if (product?.price) {
      return product.price * qty;
    }
    return 0;
  }, [qty, product]);

  // Initialize Cashfree
  const initializeCashfree = async () => {
    cashfree = await load({
      mode: "sandbox",
    });
  };

  
    initializeCashfree();

  const getSessionId = async () => {
    try {
      // passing order amount here, as we need to create order first to get payment session
      let res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders?order_amount=${price}`) 
      
      if(res.data && res.data.payment_session_id){

        console.log(res.data)
        orderId =res.data.order_id
        console.log("Payment session ID:", orderId);
        return res.data.payment_session_id
      }

    } catch (error) {
      console.log(error)
    }
  }

  const orderMutation = useMutation({
    mutationFn: (data: FormValues) => placeOrder(data),
    onSuccess: async (data) => {
      console.log("Db Transaction is complete", data);
      setIsProductAvailable(true);
      setShowBuyNow(true); // Show "Buy Now" button on success
      toast({
        title: "Product is available. You can proceed to buy now."
      });
    },
    onError: (error: AxiosError<CustomError>) => {
      console.error("Order placement error:", error);
      setShowBuyNow(false); // Hide "Buy Now" button on error
      toast({
        title: error.response?.data?.message || "Product not available",
        variant: "destructive",
      });
    },
  });

  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const verifyPayment = async (orderId: string) => {
    console.log("Verifying payment for order:", orderId);
    try {
      const response = await axios.get(`/api/verify-payment?order_id=${orderId}`);
      const data = response.data;

      console.log("Payment verification response:", data);
      setPaymentStatus(data.payment_status); // Update state with payment status

      if (data.payment_status === "SUCCESS") {
        // Handle successful payment
        alert("Payment verified successfully!");
      } else {
        // Handle unsuccessful payment
        alert("Payment verification failed.");
      }
    } catch (error) {
      console.error("Failed to verify payment:", error);
      alert("Failed to verify payment.");
    }
  };
  
  // const verifyPayment = async (orderId: string) => {
  //   try {
  //     const options = {
  //       method: 'GET',
  //       url: `https://sandbox.cashfree.com/pg/orders/${orderId}`,
  //       headers: {
  //         accept: 'application/json',
  //         'x-api-version': '2022-09-01',
  //         'x-client-id': `${process.env.CASHFREE_APP_ID}`,
  //         'x-client-secret':`${process.env.CASHFREE_SECRET_KEY}`
  //       }
  //     };
  
  //     let res = await axios.request(options);
  //     const response = res.data;
  
  //     console.log("Payment verification response:", response);
  
  //     // Assuming `response` is an array of payment objects
  //     if (response && response.length > 0) {
  //       const payment = response[0]; // Get the first payment object
  
  //       if (payment.payment_status === "SUCCESS") {
  //         toast({
  //           title: "Payment verified",
  //           description: "The payment was successful.",
  //         });
  //         alert("Payment verified");
  //         // Handle post-payment actions here
  //       } else {
  //         toast({
  //           title: "Payment not successful",
  //           description: "The payment status is not successful.",
  //           variant: "destructive",
  //         });
  //         alert("Payment not successful");
  //         // Handle the unsuccessful payment scenario
  //       }
  //     } else {
  //       toast({
  //         title: "No payment found",
  //         description: "No payment data available for this order.",
  //         variant: "destructive",
  //       });
  //     }
  
  //     return response;
  //   } catch (error) {
  //     console.error("Failed to verify payment:", error);
  //     toast({
  //       title: "Failed to verify payment",
  //       description: (error as AxiosError<CustomError>).response?.data?.message,
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const handleVerifyPayment = async () => {
  //   verifyPayment(orderId);
  //   console.log("Payment verified:", orderId);
  //   alert("Payment verified");
  // }

  // this is buttom
  const onSubmit = async (values: FormValues) => {
    console.log("Form Values:", values);
    orderMutation.mutate(values);
  };

  const handleBuyNow = async () => {
    try {
      const sessionId = await getSessionId();
      setPaymentSessionId(sessionId);
      if (cashfree && sessionId) {
        const checkoutOptions = {
          paymentSessionId: sessionId,
          redirectTarget: "_modal",
          returnUrl: `${window.location.origin}/product/${param?.id}`,
        };
        try {
          await cashfree.checkout(checkoutOptions).then(function (result: any) {
            if (result.error) {
              alert(result.error.message);
            }
            if (result.redirect) {
              console.log("Redirection");
            }
          });
          console.log("Payment initialized");
          console.log("Order ID:", orderId);
          verifyPayment(orderId);
        } catch (paymentError) {
          console.error("Error initializing payment:", paymentError);
          toast({
            title: "Payment initialization failed.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Payment gateway not initialized.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching payment session ID:", error);
      toast({
        title: "Failed to fetch payment session ID.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header />
      <section className="custom-height relative bg-[#f5f5f5]">
        <div className="z-50 mx-auto flex h-full max-w-6xl gap-x-10 px-5 py-14 md:py-20">
          <div>
            {isProductLoading ? (
              <Skeleton className="aspect-square w-[20rem] bg-brown-100" />
            ) : (
              <Image
                src={`/assets/${product?.image}`}
                alt={product?.name ?? "image"}
                width={0}
                height={0}
                sizes="100vw"
                className="aspect-square w-[20rem] rounded-md object-cover shadow-2xl"
              />
            )}
          </div>

          {isProductLoading ? (
            <div className="flex flex-1 flex-col gap-y-2">
              <Skeleton className="h-4 w-16 bg-brown-100" />
              <Skeleton className="h-10 w-2/3 bg-brown-100" />
              <div className="flex items-center gap-x-3">
                <div className="flex items-center gap-x-0.5">
                  <Star className="size-4 text-yellow-400" fill="#facc15" />
                  <Star className="size-4 text-yellow-400" fill="#facc15" />
                  <Star className="size-4 text-yellow-400" fill="#facc15" />
                  <Star className="size-4 text-yellow-400" fill="#facc15" />
                  <Star className="size-4 text-yellow-400" />
                </div>
                <span className="text-sm">144 Reviews</span>
              </div>

              <Skeleton className="mt-2 h-28 w-full bg-brown-100" />
              <Separator className="my-6 bg-brown-900" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-28 bg-brown-100" />
                <Skeleton className="h-10 w-60 bg-brown-100" />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-y-2">
              <h2 className="text-sm tracking-widest text-brown-500">
                BRAND NAME
              </h2>
              <h2 className="text-4xl font-semibold text-brown-900">
                {product?.name}
              </h2>

              <div className="flex items-center gap-x-3">
                <div className="flex items-center gap-x-0.5">
                  <Star className="size-4 text-yellow-400" fill="#facc15" />
                  <Star className="size-4 text-yellow-400" fill="#facc15" />
                  <Star className="size-4 text-yellow-400" fill="#facc15" />
                  <Star className="size-4 text-yellow-400" fill="#facc15" />
                  <Star className="size-4 text-yellow-400" />
                </div>
                <span className="text-sm">144 Reviews</span>
              </div>

              <p className="mt-1">{product?.description}</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="flex gap-x-2 mt-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="w-3/6">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea
                              className="border-brown-200 bg-white placeholder:text-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brown-400 focus-visible:ring-offset-0"
                              placeholder="e.g. Open street, 55"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem className="w-3/6">
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="h-9 border-brown-200 bg-white placeholder:text-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brown-400 focus-visible:ring-offset-0"
                              placeholder="e.g. 567987"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="qty"
                      render={({ field }) => (
                        <FormItem className="w-3/6">
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="h-9 border-brown-200 bg-white placeholder:text-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brown-400 focus-visible:ring-offset-0"
                              placeholder="e.g. 1"
                              {...field}
                              onChange={(e) => {
                                const value = parseInt(e.target.value, 10);
                                field.onChange(isNaN(value) ? 1 : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Separator className="my-6 bg-brown-900" />
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-semibold">${price}</span>
                    {session ? (
                    !showBuyNow ? (
                      <Button type="submit" variant="outline">
                        Check Availability
                      </Button>
                    ) : (
                      <Button type="button" onClick={handleBuyNow}>
                        Buy Now
                      </Button>
                    )
                  ) : (
                    <Link href={`/api/auth/signin?callbackUrl=${pathname}`}>
                      <Button>Sign in to buy</Button>
                    </Link>
                  )}
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default SingleProduct;
