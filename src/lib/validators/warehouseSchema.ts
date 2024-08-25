import { z } from "zod";

export const warehouseSchema = z.object({
    name: z.string({message: "Name is required"}),
    pincode: z.string({message: "Pincode is required"}).length(6),
});