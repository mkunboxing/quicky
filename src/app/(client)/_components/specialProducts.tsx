import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

export default function SpecialProducts() {
    const products = [
        { src: 'https://res.cloudinary.com/djy5q5962/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1725821005/product3_alm3nk.jpg', alt: 'product1', name: 'Cadbury Dairy Milk' },
        { src: 'https://res.cloudinary.com/djy5q5962/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1725821003/product2_kyxhhl.jpg', alt: 'product2', name: 'Mars Bars' },
        { src: 'https://res.cloudinary.com/djy5q5962/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1725821003/product1_rbetzg.jpg', alt: 'product3', name: 'Lindt Excellence Bar' },
        { src: 'https://res.cloudinary.com/djy5q5962/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1725821005/product3_alm3nk.jpg', alt: 'product2', name: 'Mars Bars' },
    ];

    return (
        <section className="mx-auto max-w-6xl px-5 py-14 md:py-20">
            <div className="flex items-center justify-center gap-5">
                <Separator className="h-0.5 w-20 bg-brown-900" />
                <h2 className="text-3xl font-bold tracking-tight text-brown-900">
                    Special Products
                </h2>
                <Separator className="h-0.5 w-20 bg-brown-900" />
            </div>
            <div className="mt-20 grid grid-cols-1 gap-20 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product, index) => (
                    <div key={index} className="flex flex-col items-center justify-center gap-3">
                        <Image
                            src={product.src}
                            alt={product.alt}
                            width={0}
                            height={0}
                            sizes="100vw"
                            style={{ width: '220px', height: '220px' }}
                            className="rounded-full border-8"
                        />
                        <p className="font-semibold text-brown-900">{product.name}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}