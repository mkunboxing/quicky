import { db } from "@/lib/db/db";
import {deliveryPersons} from "@/lib/db/schema";
import { deliveryPersonSchema } from "@/lib/validators/deliveryPersonsSchema";

export async function POST(request: Request) {

    // todo: check auth
    const requestedData = await request.json();

    let validateData;

    try {
        validateData = deliveryPersonSchema.parse(requestedData);
    } catch (error) {
        return Response.json({message: error}, {status: 400});
    }

    try {
        await db.insert(deliveryPersons).values(validateData);
        return Response.json({message: "ok"}, {status: 201});
    } catch (error) {
        return Response.json({message: "failed to add delivery person"}, {status: 500});
    }
}