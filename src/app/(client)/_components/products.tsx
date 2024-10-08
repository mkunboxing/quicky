"use client";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "@/http/api";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react"; // Assuming you're using Lucide icons

const Products = () => {
  const skeletons = Array.from({ length: 4 });
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getAllProducts, // this is to cache the data for 50 seconds
  });

  // Local state to track loading for each button
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuyNowClick = (productId: string) => {
    setLoading(productId); // Set loading state for the clicked button

    // Simulate an action (e.g., API call) before navigation
    setTimeout(() => {
      setLoading(null); // Reset loading after the action is done
      // Perform your action here, e.g., navigate to the product page or make an API call
    }, 4000);
  };

  return (
    <section className="bg-[#f5f5f5] px-5 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-center gap-5">
          <Separator className="h-0.5 w-20 bg-brown-900" />
          <h2 className="text-3xl font-bold tracking-tight text-brown-900">
            Products
          </h2>
          <Separator className="h-0.5 w-20 bg-brown-900" />
        </div>
        

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {isLoading ? (
            <>
              {skeletons.map((_, i) => (
                <div key={i} className="flex h-full w-full flex-col gap-5">
                  <Skeleton className="aspect-square w-full rounded-md bg-brown-100" />
                  <Skeleton className="h-5 w-full rounded-md bg-brown-100" />
                  <Skeleton className="h-5 w-10 rounded-md bg-brown-100" />
                  <Skeleton className="h-8 w-full rounded-md bg-brown-100" />
                </div>
              ))}
            </>
          ) : (
            <>
              {products?.map((product: Product) => {
                return (
                  <div
                    key={product.id}
                    className="flex flex-col items-start justify-center gap-5"
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={300}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      // style={{ width: "100%" }}
                      className="aspect-square rounded-t-md object-cover shadow-lg hover:cursor-pointer"
                    />

                    <div className="w-full">
                      <p className="text-lg font-semibold text-brown-900">
                        {product.name}
                      </p>
                      <div className="mt-1 space-x-2">
                        <span className="font-bold">${product.price}</span>
                      </div>

                      <Link href={`/product/${product.id}`}>
                        <Button
                          size={"sm"}
                          className="mt-5 w-full bg-brown-900 hover:bg-brown-800 active:bg-brown-700"
                          disabled={loading === String(product.id)} // Disable button while loading
                          onClick={() => handleBuyNowClick(String(product.id))}
                        >
                          {loading === String(product.id)? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            "Buy Now"
                          )}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Products;
