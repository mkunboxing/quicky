"use client";
import { Button } from "@/components/ui/button";
import React from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "@/http/api";
import { Product } from "@/types";
import ProductSheet from "./product-sheet";
import { useNewProduct } from "@/store/product/product-store";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ProductPage = () => {
  const { onOpen } = useNewProduct();
  const { data: products, isLoading, isError, error} = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: getAllProducts,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-bold tracking-tight">Products</h3>
        <Button size={"sm"} onClick={onOpen}>
          Add Product
        </Button>
        <ProductSheet />
      </div>

      {isError && <span className="text-red-500">Something went wrong</span>}

      {isLoading ? (
        <div className="flex flex-col items-center gap-5 justify-center">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
      ) : (
        <DataTable columns={columns} data={products || []} />
      )}
    </>
  );
};

export default ProductPage;
