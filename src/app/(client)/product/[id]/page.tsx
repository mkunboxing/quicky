"use client";
import { GetOrder, getSingleProduct, placeOrder } from "@/http/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Header from "../../_components/header";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Star, Loader2 } from "lucide-react"; // Import Loader2 for spinner
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { set, z } from "zod";
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
import { or } from "drizzle-orm";

type CustomError = {
  message: string;
};

type FormValues = z.infer<typeof orderSchema>;

const SingleProduct = () => {
  const param = useParams();
  const { toast } = useToast();
  const { data: session } = useSession();
  const pathname = usePathname();

  let [paymentOrderId, setPaymentOrderId] = useState("");
  let [OrderId, setOrderId] = useState(0);
  let cashfree: any;

  const [paymentSessionId, setPaymentSessionId] = useState("");
  const [isProductAvailable, setIsProductAvailable] = useState(true);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const [isProcessingBuyNow, setIsProcessingBuyNow] = useState(false);

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
          mode: "production",
          // mode: "sandbox", // Use "production" for production environment
        });
      
    };

  initializeCashfree();

  const orderMutation = useMutation({
    mutationFn: (data: FormValues) => placeOrder(data),
    onSuccess: async (data) => {
      console.log("Order created successfully:", data);
      setOrderId(data.id);
      setPaymentOrderId(data.paymentId);// get the order id from the response
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

  

  const getSessionId = async () => {
    try {
      // passing order amount here, as we need to create order first to get payment session
      let res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders?order_id=${paymentOrderId}&order_amount=${price}`) 
      
      if(res.data && res.data.payment_session_id){

        console.log(res.data)
        return res.data.payment_session_id
      }

    } catch (error) {
      console.log(error)
    }
  }

  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const router = useRouter()

  const verifyPayment = async (paymentOrderId: string, orderId: number) => {
    console.log("Verifying payment for order:", paymentOrderId);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/verify-payment?payment_OrderId=${paymentOrderId}&orderId=${orderId}`);
      const data = response.data;
  
      console.log("Payment verification response:", data);
      console.log("Order ID:", data.orderId, "Payment Status:", data.status);
      setPaymentStatus(data.status); // Update state with payment status
  
      if (data.status === "PAID") {
        toast({
          title: "Payment verified successfully!",
        });
        router.push('/success');
        alert("Payment verified successfully!");
      } else {
        toast({
          title: data.message,
          variant: "destructive",
        });
        router.push('/failure');
        alert(data.message || "Payment verification failed.");
      }
    } catch (error) {
      console.error("Failed to verify payment:", error);
      alert("Failed to verify payment.");
      router.push('/failure');
    }
  };
  
  // this is buttom
  const onSubmit = async (values: FormValues) => {
    console.log("Form Values:", values);
    orderMutation.mutate(values);
  };

  console.log(cashfree);
  const handleBuyNow = async () => {
    setIsProcessingBuyNow(true);
    try {
      const sessionId = await getSessionId();
      setPaymentSessionId(sessionId);
      if (cashfree && sessionId) {
        const checkoutOptions = {
          paymentSessionId: sessionId,
          redirectTarget: "_modal",
          // returnUrl: `${window.location.origin}`,
        };
        try {
          await cashfree.checkout(checkoutOptions).then(function (result: any) {
            if (result.error) {
              alert(result.error.message);
              setIsProcessingBuyNow(false);
            }
            if (result.redirect) {
              console.log("Redirection");
            }
            if(result.paymentDetails){
              // This will be called whenever the payment is completed irrespective of transaction status
              console.log("Payment has been completed, Check for Payment Status");
              console.log(result.paymentDetails.paymentMessage);
          }
          });
          console.log("Payment initialized");
          console.log("Order ID:", paymentOrderId);
          verifyPayment(paymentOrderId, OrderId);
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
    } finally {
      setIsProcessingBuyNow(false);
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
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={orderMutation.isPending}
                        >
                          {orderMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 animate-spin" />{" "}
                              Checking...
                            </>
                          ) : (
                            "Check Availability"
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleBuyNow}
                          disabled={isProcessingBuyNow} // Disable the button when processing
                        >
                          {isProcessingBuyNow ? (
                            <>
                              <Loader2 className="mr-2 animate-spin" />{" "}
                              Processing...
                            </>
                          ) : (
                            "Buy Now"
                          )}
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
