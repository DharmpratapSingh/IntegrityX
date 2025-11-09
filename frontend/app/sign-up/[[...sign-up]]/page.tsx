import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 px-4 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>

      {/* Floating Orbs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 right-40 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-2xl mb-4">
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">W</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Get Started</h1>
          <p className="text-purple-100 text-lg">Create your Walacor account</p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="animate-slide-up">
          <SignUp
            appearance={{
              variables: {
                colorPrimary: '#9333ea',
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
                socialButtonsBlockButton: 'border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200',
                socialButtonsBlockButtonText: 'font-medium text-gray-700',
                formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200',
                formFieldInput: 'border-gray-200 focus:border-purple-500 focus:ring-purple-500',
                footerActionLink: 'text-purple-600 hover:text-purple-700 font-medium',
                identityPreviewText: 'text-gray-700 font-medium',
                identityPreviewEditButton: 'text-purple-600 hover:text-purple-700',
                formFieldLabel: 'text-gray-700 font-medium',
                formFieldInputShowPasswordButton: 'text-gray-500 hover:text-gray-700',
                dividerLine: 'bg-gray-200',
                dividerText: 'text-gray-500',
                otpCodeFieldInput: 'border-gray-300 focus:border-purple-500',
              }
            }}
            redirectUrl="/integrated-dashboard"
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/80 text-sm">
          <p>Join thousands securing documents on blockchain</p>
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
