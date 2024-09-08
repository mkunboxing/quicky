import { db } from "@/lib/db/db";
import { products } from "@/lib/db/schema";
import { productSchema,isServer } from "@/lib/validators/productSchema";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { unlink } from "node:fs/promises";
import { desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

export async function POST(request: Request) {

    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ message: 'Not allowed' }, { status: 401 });
    }

 
    // @ts-ignore
    if (session.token.role !== 'admin') {
        return Response.json({ message: 'Not allowed' }, { status: 403 });
    }

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
// const filename = `${Date.now()}.${inputImage.name.split('.').slice(-1)}`;
     // mk.png to 1212125.png

    // try {
    //     const buffer = Buffer.from(await inputImage.arrayBuffer());
    //     await writeFile(path.join(process.cwd(),"public/assets",filename),buffer);
    // } catch (err) {
    //     return Response.json({message: err}, {status: 500});
    // }

    let cloudinaryResponse;
    try {
        const arrayBuffer = await inputImage.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        cloudinaryResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { resource_type: "auto" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });
    } catch (err) {
        return Response.json({message: 'Failed to upload image to Cloudinary'}, {status: 500});
    }



    try {
        // await db.insert(products).values({...validateData, image:filename})
        await db.insert(products).values({
            ...validateData, 
            image: (cloudinaryResponse as any).secure_url
        });
    } catch (err) {

        // todo: remove stored image from fs
        if (cloudinaryResponse) {
            await cloudinary.uploader.destroy((cloudinaryResponse as any).public_id);
        }
        
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

