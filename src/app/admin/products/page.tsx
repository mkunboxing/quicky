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
import { Skeleton } from "@/components/ui/skeleton";

// Define a type for the skeleton data
type SkeletonProduct = {
  id: number;
  name: React.ReactNode;
  price: React.ReactNode;
  category: React.ReactNode;
  // Add other fields from your Product type, using React.ReactNode for skeleton fields
};

// Create a union type that can be either a Product or a SkeletonProduct
type ProductOrSkeleton = Product | SkeletonProduct;

const ProductPage = () => {
  const { onOpen } = useNewProduct();
  const { data: products, isError, isFetching } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: getAllProducts,
  });

  // Create skeleton data for loading state
  const skeletonData: SkeletonProduct[] = Array(5).fill({}).map((_, index) => ({
    id: index,
    name: <Skeleton className="h-4 w-[200px]" />,
    price: <Skeleton className="h-4 w-[100px]" />,
    category: <Skeleton className="h-4 w-[150px]" />,
    // Add more fields as needed to match your Product type
  }));

  // Combine the products and skeleton data into a single array
  const tableData: ProductOrSkeleton[] = isFetching ? skeletonData : (products || []);

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

      <DataTable 
        columns={columns} 
        data={tableData}
      />
    </>
  );
};

export default ProductPage;