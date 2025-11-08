import Link from 'next/link'
import { Shield, FileText, TrendingUp, Lock, Zap, Users } from 'lucide-react'
import TrustSignals from '@/components/TrustSignals'

export default function LandingPage() {
  const features = [
    {
      icon: FileText,
      title: 'Document Verification',
      description: 'Upload and verify document integrity with blockchain-backed security'
    },
    {
      icon: Shield,
      title: 'Attestations',
      description: 'Create and manage document attestations with cryptographic proof'
    },
    {
      icon: Lock,
      title: 'Provenance Tracking',
      description: 'Track complete document lineage and relationships'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'AI-powered risk prediction and compliance forecasting'
    },
    {
      icon: Zap,
      title: 'Voice Commands',
      description: 'Control operations with natural voice commands'
    },
    {
      icon: Users,
      title: 'Multi-Party Verification',
      description: 'Privacy-preserving third-party document authentication'
    },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background with orbs */}
      <div className="absolute inset-0 bg-gradient-hero-financial">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Security badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-semibold">Bank-Grade Security • SOC 2 Certified</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Walacor Financial
            <span className="block bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Integrity Platform
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Blockchain-verified document security with AI-powered fraud detection. 
            Trusted by leading financial institutions worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link 
              href="/sign-up"
              className="px-10 py-5 bg-white text-blue-900 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-blue-500/50 transform hover:scale-105 duration-300 text-lg"
            >
              Get Started Free →
            </Link>
            <Link 
              href="/sign-in"
              className="px-10 py-5 bg-white/10 backdrop-blur-md text-white font-bold border-2 border-white/30 rounded-2xl hover:bg-white/20 transition-all shadow-xl transform hover:scale-105 duration-300 text-lg"
            >
              Sign In
            </Link>
          </div>
          
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">99.9%</p>
              <p className="text-blue-200 text-sm">Uptime Guarantee</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">10K+</p>
              <p className="text-blue-200 text-sm">Documents Daily</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">&lt;100ms</p>
              <p className="text-blue-200 text-sm">Response Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to secure, verify, and manage financial documents with confidence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className="group relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2"
                >
                  {/* Gradient glow on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-600/0 group-hover:from-blue-500/10 group-hover:to-purple-600/10 rounded-2xl transition-all duration-300" />
                  
                  {/* Content */}
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Trust Signals Section */}
      <TrustSignals />

      {/* CTA Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 py-24 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full filter blur-3xl animate-blob animation-delay-2000" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Secure Your Documents?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Join thousands of financial institutions worldwide protecting their critical documents with blockchain-verified security
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/sign-up"
              className="px-10 py-5 bg-white text-blue-900 font-bold rounded-2xl hover:bg-blue-50 transition-all shadow-2xl hover:shadow-white/50 transform hover:scale-105 duration-300 text-lg"
            >
              Start Free Trial →
            </Link>
            <Link 
              href="/integrated-dashboard"
              className="px-10 py-5 bg-transparent text-white font-bold border-2 border-white rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all shadow-xl transform hover:scale-105 duration-300 text-lg"
            >
              View Demo
            </Link>
          </div>
          
          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 items-center">
            <div className="text-white/80 text-sm font-semibold">✓ No credit card required</div>
            <div className="text-white/80 text-sm font-semibold">✓ Free 14-day trial</div>
            <div className="text-white/80 text-sm font-semibold">✓ Cancel anytime</div>
          </div>
        </div>
      </div>
    </div>
  )
}
