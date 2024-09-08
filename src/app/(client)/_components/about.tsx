import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import React from 'react';

export default function About() {
    return (
        <section className="max-w-6xl mx-auto px-5 md:py-20 py-14">
            <div className="px-10 py-14 rounded-t-[3rem] bg-gradient-to-b from-gray-200 to-transparent max-w-4xl mx-auto flex justify-center items-center flex-col">
                <div className="flex justify-center items-center gap-5">
                    <Separator className="w-20 bg-brown-900 h-0.5" />
                    <h2 className="text-brown-900 text-3xl font-bold tracking-tight">
                        About Us
                    </h2>
                    <Separator className="w-20 bg-brown-900 h-0.5" />
                </div>
                <p className="text-center mt-10 w-10/12">
                    We are selling World Class chocolate products from around the world. We have
                    been in the chocolate business for over 10 years. We are a family-owned business
                    with a passion for quality. We are committed to providing the best products and 
                    service to our customers. We are proud to offer a wide selection of chocolates and
                    treats. We have something for everyone, from the casual chocolate lover to the
                    elite chocolate master. We are dedicated to providing the best products and service
                    to our customers. We are always looking for new and exciting products to add to our
                    collection. We are constantly updating our inventory to provide the best selection
                    of products. We are proud to offer a wide selection of chocolates and treats.
                </p>
                <Button className="mt-10 bg-brown-900 hover:bg-brown-800 active:bg-brown-700 px-8">
                    Shop Now
                </Button>
            </div>
        </section>
    );
}