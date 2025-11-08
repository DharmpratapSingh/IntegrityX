import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Shield, Lock, FileCheck, TrendingUp } from 'lucide-react'

export default function BaseFooter() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      
      <div className="container relative grid items-center justify-center gap-8 px-4 text-center md:px-6">
        <div className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tighter md:text-4xl/tight bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Secure Your Financial Documents Today
          </h2>
          <p className="mx-auto max-w-[600px] text-blue-100 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Blockchain-verified document integrity with AI-powered fraud detection. Bank-grade security trusted by financial institutions worldwide.
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
            <div className="flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Shield className="h-8 w-8 text-blue-300" />
              <span className="text-sm font-semibold">Blockchain Security</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Lock className="h-8 w-8 text-purple-300" />
              <span className="text-sm font-semibold">256-bit Encryption</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <FileCheck className="h-8 w-8 text-pink-300" />
              <span className="text-sm font-semibold">Instant Verification</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <TrendingUp className="h-8 w-8 text-cyan-300" />
              <span className="text-sm font-semibold">AI Analytics</span>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/sign-up">
              <Button className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Get Started Free
              </Button>
            </Link>
            <Link href="/integrated-dashboard">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Footer bottom */}
        <div className="border-t border-white/20 pt-8 mt-8">
          <p className="text-blue-200 text-sm">
            © 2025 Walacor Financial Integrity Platform. All rights reserved. | Bank-grade security • SOC 2 Certified • ISO 27001 Compliant
          </p>
        </div>
      </div>
    </section>
  );
}
