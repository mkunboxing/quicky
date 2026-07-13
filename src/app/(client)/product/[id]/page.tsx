"use client";
import { GetOrder, getSingleProduct, placeOrder } from "@/http/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Header from "../../_components/header";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Star, Loader2 } from "lucide-react";
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

// ─── COD Confirmation Dialog ───────────────────────────────────────────────
function CodDialog({
  open,
  onAccept,
  onDecline,
  isLoading,
}: {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isLoading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      {/* Card */}
      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-brown-100 bg-white px-8 py-8 shadow-2xl">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="mt-3 text-xl font-bold text-brown-900">Payment not completed</h2>
        <p className="mt-2 text-sm text-brown-500">
          Your online payment was not completed. Would you like to proceed with{" "}
          <span className="font-semibold text-brown-800">Cash on Delivery</span> instead?
        </p>
        <div className="mt-6 flex gap-3">
          <button
            id="cod-decline-btn"
            onClick={onDecline}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-brown-200 px-4 py-2.5 text-sm font-medium text-brown-700 transition hover:bg-brown-50 disabled:opacity-50"
          >
            No, Cancel Order
          </button>
          <button
            id="cod-accept-btn"
            onClick={onAccept}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-brown-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brown-700 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirming…
              </span>
            ) : (
              "Yes, Cash on Delivery"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
const SingleProduct = () => {
  const param = useParams();
  const { toast } = useToast();
  const { data: session } = useSession();
  const pathname = usePathname();

  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [OrderId, setOrderId] = useState(0);
  const cashfreeRef = React.useRef<any>(null);

  const [paymentSessionId, setPaymentSessionId] = useState("");
  const [isProductAvailable, setIsProductAvailable] = useState(true);
  const [showBuyNow, setShowBuyNow] = useState(false);
  const [isProcessingBuyNow, setIsProcessingBuyNow] = useState(false);

  // COD dialog state
  const [showCodDialog, setShowCodDialog] = useState(false);
  const [isCodLoading, setIsCodLoading] = useState(false);
  // Refs to current order ids for use inside async closures
  const pendingPaymentOrderIdRef = React.useRef("");
  const pendingOrderIdRef = React.useRef(0);

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

  // Initialize Cashfree once on mount
  useEffect(() => {
    const initializeCashfree = async () => {
      cashfreeRef.current = await load({
        mode: "sandbox", // Switch to "production" when your Cashfree account is activated
      });
      console.log("Cashfree initialized:", cashfreeRef.current);
    };
    initializeCashfree();
  }, []);

  const orderMutation = useMutation({
    mutationFn: (data: FormValues) => placeOrder(data),
    onSuccess: async (data) => {
      console.log("Order created successfully:", data);
      setOrderId(data.id);
      setPaymentOrderId(data.paymentId);
      setIsProductAvailable(true);
      setShowBuyNow(true);
      toast({ title: "Product is available. You can proceed to buy now." });
    },
    onError: (error: AxiosError<CustomError>) => {
      console.error("Order placement error:", error);
      setShowBuyNow(false);
      toast({
        title: error.response?.data?.message || "Product not available",
        variant: "destructive",
      });
    },
  });

  const router = useRouter();

  const getSessionId = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders?order_id=${paymentOrderId}&order_amount=${price}`
      );
      if (res.data && res.data.payment_session_id) {
        console.log(res.data);
        return res.data.payment_session_id;
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Called after Cashfree modal closes (regardless of success/failure).
   * Verifies payment status with our backend.
   * If PAID  → delivery person assigned by server, redirect to success.
   * If FAILED → show COD popup.
   */
  const verifyPayment = async (pOrderId: string, oId: number) => {
    console.log("Verifying payment for order:", pOrderId);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/verify-payment?payment_OrderId=${pOrderId}&orderId=${oId}`
      );
      const data = response.data;
      console.log("Payment verification response:", data);

      if (data.status === "PAID") {
        toast({ title: "Payment verified successfully!" });
        router.push("/payment/success");
      } else {
        // Payment incomplete — show COD dialog
        pendingPaymentOrderIdRef.current = pOrderId;
        pendingOrderIdRef.current = oId;
        setShowCodDialog(true);
      }
    } catch (error) {
      console.error("Failed to verify payment:", error);
      // Still show COD dialog so the user can choose
      pendingPaymentOrderIdRef.current = pOrderId;
      pendingOrderIdRef.current = oId;
      setShowCodDialog(true);
    }
  };

  /** User chose Cash on Delivery */
  const handleCodAccept = async () => {
    setIsCodLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/cod`, {
        orderId: pendingOrderIdRef.current,
      });
      setShowCodDialog(false);
      toast({ title: "Cash on Delivery confirmed! Delivery person assigned." });
      router.push("/payment/success");
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || "Failed to confirm COD",
        variant: "destructive",
      });
    } finally {
      setIsCodLoading(false);
    }
  };

  /** User declined COD — cancel & release stock */
  const handleCodDecline = async () => {
    setIsCodLoading(true);
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/cod`, {
        data: { orderId: pendingOrderIdRef.current },
      });
      setShowCodDialog(false);
      toast({ title: "Order cancelled. Reserved stock has been released.", variant: "destructive" });
      // Reset form state so user can try again
      setShowBuyNow(false);
      setPaymentOrderId("");
      setOrderId(0);
      router.push("/");
    } catch (err: any) {
      toast({
        title: err.response?.data?.message || "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setIsCodLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    console.log("Form Values:", values);
    orderMutation.mutate(values);
  };

  const handleBuyNow = async () => {
    setIsProcessingBuyNow(true);
    const cashfree = cashfreeRef.current;
    try {
      const sessionId = await getSessionId();
      setPaymentSessionId(sessionId);
      if (cashfree && sessionId) {
        const checkoutOptions = {
          paymentSessionId: sessionId,
          redirectTarget: "_modal",
        };
        try {
          await cashfree.checkout(checkoutOptions).then(function (result: any) {
            if (result.error) {
              console.error("Cashfree checkout error:", result.error.message);
            }
            if (result.redirect) {
              console.log("Redirection");
            }
            if (result.paymentDetails) {
              console.log("Payment completed. Checking status…");
              console.log(result.paymentDetails.paymentMessage);
            }
          });
          console.log("Cashfree checkout done. Verifying payment…");
          await verifyPayment(paymentOrderId, OrderId);
        } catch (paymentError) {
          console.error("Error in checkout:", paymentError);
          toast({ title: "Payment initialization failed.", variant: "destructive" });
        }
      } else {
        toast({ title: "Payment gateway not initialized.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching payment session ID:", error);
      toast({ title: "Failed to fetch payment session ID.", variant: "destructive" });
    } finally {
      setIsProcessingBuyNow(false);
    }
  };

  return (
    <>
      {/* COD Dialog */}
      <CodDialog
        open={showCodDialog}
        onAccept={handleCodAccept}
        onDecline={handleCodDecline}
        isLoading={isCodLoading}
      />

      <Header />
      <section className="custom-height relative bg-[#f5f5f5]">
        <div className="z-50 mx-auto flex h-full max-w-6xl gap-x-10 px-5 py-14 md:py-20">
          <div>
            {isProductLoading ? (
              <Skeleton className="aspect-square w-[20rem] bg-brown-100" />
            ) : (
              <Image
                src={product?.image}
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
              <h2 className="text-sm tracking-widest text-brown-500">BRAND NAME</h2>
              <h2 className="text-4xl font-semibold text-brown-900">{product?.name}</h2>

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
                    <span className="text-3xl font-semibold">₹{price}</span>
                    {session ? (
                      !showBuyNow ? (
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={orderMutation.isPending}
                        >
                          {orderMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 animate-spin" /> Checking...
                            </>
                          ) : (
                            "Check Availability"
                          )}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleBuyNow}
                          disabled={isProcessingBuyNow}
                        >
                          {isProcessingBuyNow ? (
                            <>
                              <Loader2 className="mr-2 animate-spin" /> Processing...
                            </>
                          ) : (
                            "Buy Now"
                          )}
                        </Button>
                      )
                    ) : (
                      <Link href={`/login?callbackUrl=${pathname}`}>
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
