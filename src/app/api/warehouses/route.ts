import { db } from "@/lib/db/db";
import { warehouses } from "@/lib/db/schema";
import { warehouseSchema } from "@/lib/validators/warehouseSchema";

export async function POST(request: Request) {

    // todo: check auth
    const requestedData = await request.json();

    let validateData;
    try {
        validateData = await warehouseSchema.parse(requestedData);
    } catch (error) {
        return Response.json({message: error}, {status: 400});
    }

    try {
        await db.insert(warehouses).values(validateData);
        return Response.json({message: "ok"}, {status: 201});
    } catch (error) {
        return Response.json({message: "failed to add warehouse"}, {status: 500});
        
    }
}

export async function GET(){

    try {
        const allWarehouses = await db.select().from(warehouses); // we can write limit for pagination here

        return Response.json(allWarehouses);
    } catch (error) {
        return Response.json({message: "failed to fetch warehouses"}, {status: 500});
    }

}