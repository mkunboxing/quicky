import { z } from "zod";

export const productSchema = z.object({
    name: z.string({message: "Name is required"}),
    image: z.instanceof(File,{message: "Image is required"}),
    description: z.string({message: "Description is required"}),
    price: z.number({message: "Price is required"}),
});