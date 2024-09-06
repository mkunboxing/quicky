"use client";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Your contact details (to be displayed)
const businessDetails = {
  email: "mkunboxing@gmail.com",
  mobile: "+917274989153",
  operatingAddress: "Patna,Bihar, India, 801103",
  legalName: "Quicky Private Limited",
};

// Validation schema using Zod
const contactSchema = z.object({
  email: z.string().email("Invalid email address").nonempty("Email is required"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Invalid mobile number"),
  operatingAddress: z.string().nonempty("Operating address is required"),
  legalName: z.string().nonempty("Legal name is required"),
});

interface ContactFormInputs {
  email: string;
  mobile: string;
  operatingAddress: string;
  legalName: string;
}

const ContactUs: React.FC = () => {
  const form = useForm<ContactFormInputs>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: "",
      mobile: "",
      operatingAddress: "",
      legalName: "",
    },
  });

  const onSubmit = (data: ContactFormInputs) => {
    console.log("Form Data:", data);
    // Handle form submission logic (e.g., send data to server)
  };

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Contact Us</h2>

      {/* Display your business details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Business Contact Information</h3>
        <p><strong>Email:</strong> {businessDetails.email}</p>
        <p><strong>Mobile:</strong> {businessDetails.mobile}</p>
        <p><strong>Operating Address:</strong> {businessDetails.operatingAddress}</p>
        <p><strong>Legal Name:</strong> {businessDetails.legalName}</p>
      </div>

      <h3 className="text-lg font-semibold mb-4">Send Us a Message</h3>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Email Address */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage>{form.formState.errors.email?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Mobile Number */}
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your mobile number" {...field} />
                </FormControl>
                <FormMessage>{form.formState.errors.mobile?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Legal Name */}
          <FormField
            control={form.control}
            name="legalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage>{form.formState.errors.legalName?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <span className="loader animate-spin" /> : "Submit"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ContactUs;