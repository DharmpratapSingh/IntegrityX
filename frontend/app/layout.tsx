import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { LayoutContent } from "@/components/LayoutContent";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

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
        <body className={inter.className}>
          <LayoutContent>{children}</LayoutContent>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
