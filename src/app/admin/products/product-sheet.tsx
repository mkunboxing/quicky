import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import React from "react";
import CreateProductForm, { FormValues } from "./create-product-form";
import { create } from "domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@/http/api";
import { useNewProduct } from "@/store/product/product-store";

const ProductSheet = () => {
    const {isOpen,onClose} = useNewProduct();
    const queryClient = useQueryClient();

    

    const {mutate} = useMutation({
        mutationKey: ["create-product"],
        mutationFn: (data: FormData)=> createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["products"]});
            alert("Product created successfully");
        },
    })
    const onSubmit = (values: FormValues) => {
        console.log(values);
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("description", values.description);
        formData.append("price", values.price.toString());
        formData.append("image", (values.image as FileList)[0]);

        mutate(formData);
    }
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="min-w-[28rem] space-y-4">
        <SheetHeader>
          <SheetTitle>Create Product</SheetTitle>
        </SheetHeader>
        <CreateProductForm onSubmit={onSubmit} />
      </SheetContent>
    </Sheet>
  );
};

export default ProductSheet;
