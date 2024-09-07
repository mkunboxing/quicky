import { authOptions } from "@/lib/auth/authOptions";
import { db } from "@/lib/db/db";
import {deliveryPersons, warehouses} from "@/lib/db/schema";
import { deliveryPersonSchema } from "@/lib/validators/deliveryPersonsSchema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

export async function POST(request: Request) {

     // todo: verify if user is admin

     const session = await getServerSession(authOptions);

     if (!session) {
         return Response.json({ message: 'Not allowed' }, { status: 401 });
     }
     // todo: check user access.
     // @ts-ignore
     if (session.token.role !== 'admin') {
         return Response.json({ message: 'Not allowed' }, { status: 403 });
     }

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

export async function GET(){

    try {
        const alldeliveryPersons = await db
          .select({
            id: deliveryPersons.id,
            name: deliveryPersons.name,
            phone: deliveryPersons.phone,
            warehouse: warehouses.name,
          })
          .from(deliveryPersons)
          .leftJoin(warehouses, eq(deliveryPersons.warehouseId, warehouses.id))
          .orderBy(desc(deliveryPersons.id)); // we can write limit for pagination here


        return Response.json(alldeliveryPersons);
    } catch (error) {
        return Response.json({message: "failed to fetch delivery persons"}, {status: 500});
    }

}