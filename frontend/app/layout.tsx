import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { LayoutContent } from "@/components/LayoutContent";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const bloxBrk = localFont({
  src: [
    {
      path: "../public/fonts/Blox2.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  preload: true,
  display: "swap",
});

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  console.error(
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication UI will not load. Update frontend/.env.local with a valid publishable key."
  );
} else {
  console.log("Clerk publishable key detected:", clerkPublishableKey);
}

export const metadata: Metadata = {
  title: "Walacor Financial Integrity Platform",
  description: "Secure document verification, attestations, and compliance management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#2563eb',
          borderRadius: '0.75rem',
        },
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/integrated-dashboard"
      signUpFallbackRedirectUrl="/integrated-dashboard"
      afterSignOutUrl="/sign-in"
      publishableKey={clerkPublishableKey}
    >
      <html lang="en">
        <body className={`${inter.className} ${bloxBrk.variable}`}>
          <LayoutContent>{children}</LayoutContent>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #bbf7d0',
                },
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fecaca',
                },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
