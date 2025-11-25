"use client";

import { SignUp } from "@clerk/nextjs";

// IntegrityX Elite - Minimal sign-up page
export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      {/* Simple centered layout */}
      <div className="w-full max-w-md">
        {/* Minimal branding */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-elite-dark mb-2">
            IntegrityX
          </h1>
          <p className="text-elite-gray">
            Create your account
          </p>
        </div>

        {/* Clean sign-up form */}
        <SignUp
          appearance={{
            variables: {
              colorPrimary: '#1e52f3',
              colorBackground: '#ffffff',
              colorInputBackground: '#ffffff',
              colorInputText: '#0f172a',
              colorText: '#0f172a',
              colorTextSecondary: '#64748b',
              colorDanger: '#ef4444',
              colorSuccess: '#10b981',
              borderRadius: '0.5rem',
              fontFamily: 'Inter, system-ui, sans-serif',
            },
            elements: {
              rootBox: 'w-full',
              card: 'shadow-sm border border-gray-200 bg-white',
              headerTitle: 'text-elite-dark font-semibold text-2xl',
              headerSubtitle: 'text-elite-gray text-base',
              socialButtonsBlockButton:
                'border-gray-300 hover:border-elite-blue hover:bg-gray-50 transition-colors duration-200',
              socialButtonsBlockButtonText: 'font-medium text-gray-700',
              formButtonPrimary:
                'bg-elite-blue hover:bg-[#1d4ed8] text-white font-medium transition-colors duration-200',
              formFieldInput:
                'border-gray-300 focus:border-elite-blue focus:ring-1 focus:ring-elite-blue transition-colors duration-200',
              formFieldLabel: 'text-gray-700 font-medium text-sm',
              formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
              footerActionLink: 'text-elite-blue hover:text-[#1d4ed8] font-medium',
              identityPreviewText: 'text-gray-700 font-medium',
              identityPreviewEditButton: 'text-elite-blue hover:text-[#1d4ed8]',
              dividerLine: 'bg-gray-200',
              dividerText: 'text-gray-500',
              otpCodeFieldInput: 'border-gray-300 focus:border-elite-blue',
            }
          }}
          forceRedirectUrl="/integrated-dashboard"
        />

        {/* Minimal footer */}
        <p className="text-center text-sm text-elite-gray mt-8">
          Join thousands securing documents on blockchain
        </p>
      </div>
    </div>
  );
}
