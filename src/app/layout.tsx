import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from "@/components/ui/toaster";
import dynamic from 'next/dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import AuthProvider from "@/providers/auth-provider";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Quicky Inc",
  description: "The best online store in the world",
};

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(mod => mod.ReactQueryDevtools),
  { ssr: false }
);


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getServerSession(authOptions)
  console.log("session", session);
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <QueryProvider>
          <AuthProvider session={session}>
            {children}
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
