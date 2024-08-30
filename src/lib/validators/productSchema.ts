import { z } from "zod";

export const isServer = typeof window === "undefined";

export const productSchema = z.object({
    name: z.string({message: "Name is required"}).min(3),
    image: z.instanceof(isServer ? File : FileList, { message: 'Product image should be a image' }),
    description: z.string({message: "Description is required"}).min(5),
    price: z.number({message: "Price is required"}),
});