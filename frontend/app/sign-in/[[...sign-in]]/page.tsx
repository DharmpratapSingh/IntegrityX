"use client";

import { SignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

// Premium themed sign-in page - let Clerk handle all redirects
export default function SignInPage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-4 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-40 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-2xl mb-4">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">W</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Welcome Back</h1>
          <p className="text-blue-100 text-lg">Sign in to your Walacor account</p>
        </div>

        {/* Clerk Sign In Component */}
        {/* Now using shadcn theme globally - only override for glassmorphism effect */}
        <div className="animate-slide-up">
          <SignIn
            appearance={{
              elements: {
                card: 'shadow-2xl bg-white/95 backdrop-blur-xl border-0',
                formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200',
              }
            }}
            redirectUrl="/integrated-dashboard"
          />
                  variables: {
                    colorPrimary: '#2563eb',
                    colorBackground: '#ffffff',
                    colorInputBackground: '#f9fafb',
                    colorInputText: '#111827',
                    colorText: '#1f2937',
                    colorTextSecondary: '#6b7280',
                    colorDanger: '#ef4444',
                    colorSuccess: '#10b981',
                    colorWarning: '#f59e0b',
                    borderRadius: '0.75rem',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  },
                  elements: {
                    rootBox: 'mx-auto',
                    card: 'shadow-2xl bg-white/95 backdrop-blur-xl border-0',
                    headerTitle: 'text-gray-900 font-bold text-2xl',
                    headerSubtitle: 'text-gray-600',
                    socialButtonsBlockButton: 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200',
                    socialButtonsBlockButtonText: 'font-medium text-gray-700',
                    formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200',
                    formFieldInput: 'border-gray-200 focus:border-blue-500 focus:ring-blue-500',
                    footerActionLink: 'text-blue-600 hover:text-blue-700 font-medium',
                    identityPreviewText: 'text-gray-700 font-medium',
                    identityPreviewEditButton: 'text-blue-600 hover:text-blue-700',
                    formFieldLabel: 'text-gray-700 font-medium',
                    formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
                    dividerLine: 'bg-gray-200',
                    dividerText: 'text-gray-500',
                    otpCodeFieldInput: 'border-gray-300 focus:border-blue-500',
                  }
                }}
                forceRedirectUrl="/integrated-dashboard"
              />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/80 text-sm">
          <p>Secured by blockchain technology</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}
