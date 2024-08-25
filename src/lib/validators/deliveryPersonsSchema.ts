import { z } from "zod";

export const deliveryPersonSchema = z.object({
    name: z.string({message: "Name is required"}),
    phone: z.string({message: "Phone is required"}).length(13,"Phone must be 13 digits long"),
    warehouseId: z.number({message: "Warehouse is required"}),
});