"use client";
import { GetOrder, getSingleProduct, placeOrder } from "@/http/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import Header from "../../_components/header";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Star } from "lucide-react";
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
import {load} from '@cashfreepayments/cashfree-js';
import axios, { AxiosError } from "axios";
type CustomError = {
  message: string
}

type FormValues = z.infer<typeof orderSchema>;

const SingleProduct = () => {
  const param = useParams();
  const {toast} = useToast();
  const {data: session} = useSession();
  const pathname = usePathname();

  const [orderId, setOrderId] = useState("");
  const [cashfree, setCashfree] = useState<any>(null);
  const [paymentSessionId, setPaymentSessionId] = useState("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", param.id],
    queryFn: () => getSingleProduct(param.id as string),
  });

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      address: "",
      pincode: "",
      qty: 1,
      productId: Number(param.id),
    },
  });

  const qty = form.watch("qty");
  const price = React.useMemo(()=>{
    if(product?.price){
      return product.price * qty;
    }
    return 0;
  },[qty, product]);

  // Fetch payment session ID
  useEffect(() => {
    const fetchPaymentSessionId = async () => {
      try {
        const response = await axios.get(`/api/orders?order_amount=${price}`);
        if (response.data && response.data.payment_session_id) {
          setPaymentSessionId(response.data.payment_session_id);
        } else {
          toast({
            title: "Failed to retrieve payment session ID",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching payment session ID:", error);
        toast({
          title: "Failed to fetch payment session ID",
          variant: "destructive",
        });
      }
    };
  
    fetchPaymentSessionId();
  }, [price, toast])

  const orderMutation = useMutation({
    mutationFn: (data: FormValues) => placeOrder(data),
    onSuccess: async (data) => {
      console.log("Order placement success data:", data);
      setOrderId(data?.order_id);

      if (paymentSessionId && cashfree) {
        let checkoutOptions = {
          paymentSessionId: paymentSessionId,
          redirectTarget: "_modal",
        };

        try {
          await cashfree.checkout(checkoutOptions);
          console.log("Payment initialized");
          verifyPayment(data?.order_id);
        } catch (error) {
          console.error("Error initializing payment", error);
          toast({
            title: "Payment initialization failed.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Failed to retrieve payment session ID.",
          variant: "destructive",
        });
      }
    },
    onError: (error: AxiosError<CustomError>) => {
      console.error("Order placement error:", error);
      toast({
        title: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
  const verifyPayment = async (orderId: string) => {
    try {
      const response = await GetOrder(orderId);
      console.log("Payment verification response:", response);

      if (response) {
        toast({
          title: "Payment verified"
        });
        // Handle post-payment actions here
      }
    } catch (error) {
      console.error("Failed to verify payment:", error);
      toast({
        title: "Failed to verify payment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initializeCashfree = async () => {
      const cfInstance = await load({ mode: "sandbox" });
      setCashfree(cfInstance);
    };

    initializeCashfree();
  }, []);

  // const getSessionId = async () => {
  //   try {
  //     let res = await axios.get("http://localhost:3000/api/orders")

  //     console.log("reached here")
      
  //     if(res.data && res.data.payment_session_id){

  //       // console.log(res.data)
  //       console.log("api reached here", res.data.payment_session_id)
  //       setOrderId(res.data.order_id)
  //       return res.data.payment_session_id
  //     }


  //   } catch (error) {
  //     console.log(error)
  //   }
  // }


  // const verifyPayment = async (orderid: string) => {
  //   try {
  //     let res = await axios.post("http://localhost:3000/api/orders", {
  //       orderId: orderid,
  //     });
  //     console.log("Payment verification response:", res.data);

  //     if (res && res.data) {
  //       toast({
  //         title: "Payment verified",
  //         color: "green",
  //       });
  //       // Redirect to success page or handle post-payment actions here
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     toast({
  //       title: "Failed to verify payment",
  //       color: "red",
  //     });
  //   }
  // };

  // const { mutate } = useMutation({
  //   mutationKey: ["order"],
  //   mutationFn: (data: FormValues) => placeOrder({ ...data, productId: Number(param.id) }),

  //   onSuccess: async (data) => {
  //     console.log("Order placement success data:", data);
  //     const paymentSessionId = data?.payment_session_id;
  //     setOrderId(data?.order_id);

  //     if (paymentSessionId && cashfree) {
  //       // Redirect to the payment page
  //       let checkoutOptions = {
  //         paymentSessionId: paymentSessionId,
  //         redirectTarget: "_self", // or "_blank" for new tab
  //       };

  //       cashfree.checkout(checkoutOptions)
  //         .then((res: any) => {
  //           console.log("Payment initialized", res);
  //           verifyPayment(); // Call verify payment after checkout is initiated
  //         })
  //         .catch((error: any) => {
  //           console.error("Error initializing payment", error);
  //           toast({
  //             title: "Payment initialization failed.",
  //             color: "red",
  //           });
  //         });
  //     } else {
  //       toast({
  //         title: "Failed to retrieve payment session ID.",
  //         color: "red",
  //       });
  //     }
  //   },
  //   onError: (err: AxiosError<CustomError>) => {
  //     console.error("Order placement error:", err);
  //     toast({
  //       title: err.response?.data?.message || "Something went wrong",
  //       color: "red",
  //     });
  //   },
  // });

  const onSubmit = async (values: FormValues) => {
    console.log("form",values);
    
  console.log("orderId from state", orderId)
    // mutate(values); // Place order and initiate payment process
    orderMutation.mutate(values);
  };

 


  return (
    <>
      <Header />
      <section className="custom-height relative bg-[#f5f5f5]">
        <div className="z-50 mx-auto flex h-full max-w-6xl gap-x-10 px-5 py-14 md:py-20">
          <div>
            {isLoading ? (
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

          {isLoading ? (
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
                      render={({ field }) => {
                        return (
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
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => {
                        return (
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
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="qty"
                      render={({ field }) => {
                        return (
                          <FormItem className="w-3/6">
                            <FormLabel>Qty</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="h-9 border-brown-200 bg-white placeholder:text-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brown-400 focus-visible:ring-offset-0"
                                placeholder="e.g. 1"
                                {...field}
                                onChange={(e) => {
                                  const vlaue= parseFloat(e.target.value);
                                  field.onChange(vlaue);
                                }}
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  <Separator className="my-6 bg-brown-900" />
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-semibold">${price}</span>
                    {
                      session ? (
                        <Button type="submit">Buy Now</Button>
                      ) : (
                        <Link href={`/api/auth/signin?callbackUrl=${pathname}`}>
                        <Button>Sign in to buy</Button>
                        </Link>
                      )
                    }
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
