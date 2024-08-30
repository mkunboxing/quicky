import { db } from "@/lib/db/db";
import { products } from "@/lib/db/schema";
import { productSchema,isServer } from "@/lib/validators/productSchema";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { unlink } from "node:fs/promises";
import { desc } from "drizzle-orm";

export async function POST(request: Request) {
    // todo: check user access
    const data = await request.formData();

    let validateData;

    try {
        validateData = productSchema.parse({
            name: data.get("name"),
            image: data.get("image"),
            description: data.get("description"),
            price: Number(data.get("price")),
        });
    } catch (err) {
        return Response.json({message: err}, {status: 400});
    }

    const inputImage = isServer
    ? (validateData.image as File)
    : (validateData.image as FileList)[0];
const filename = `${Date.now()}.${inputImage.name.split('.').slice(-1)}`;
     // mk.png to 1212125.png

    try {
        const buffer = Buffer.from(await inputImage.arrayBuffer());
        await writeFile(path.join(process.cwd(),"public/assets",filename),buffer);
    } catch (err) {
        return Response.json({message: err}, {status: 500});
    }

    try {
        await db.insert(products).values({...validateData, image:filename})
    } catch (err) {

        // todo: remove stored image from fs
        
        return Response.json({message: 'Failed to store image to database'}, {status: 500});
    }

    return Response.json({message: 'OK'}, {status: 201});
}

export async function GET() {
    try {
      const allproducts = await db
        .select()
        .from(products)
        .orderBy(desc(products.id));
      return Response.json(allproducts);
    } catch (error) {
      return Response.json(
        { message: "Failed to fetch products" },
        { status: 500 }
      );
    }
    
}