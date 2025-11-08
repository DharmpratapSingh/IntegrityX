'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  generateDemoDocumentSet,
  demoDocumentToFile,
  generateDemoKYCData
} from '@/utils/demoDataGenerator';
import { simpleToast as toast } from '@/components/ui/simple-toast';

interface DemoModeButtonProps {
  onDemoComplete?: () => void;
}

export function DemoModeButton({ onDemoComplete }: DemoModeButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const router = useRouter();

  async function runDemo() {
    setIsRunning(true);
    setProgress(0);

    try {
      // Step 1: Generate documents
      setCurrentStep('Generating sample loan documents...');
      setProgress(20);
      await sleep(800);

      const demoDocuments = generateDemoDocumentSet();
      const demoKYC = generateDemoKYCData();

      // Step 2: Store in sessionStorage for upload page
      setCurrentStep('Preparing demo data...');
      setProgress(40);
      await sleep(600);

      sessionStorage.setItem('demoMode', 'true');
      sessionStorage.setItem('demoDocuments', JSON.stringify(demoDocuments));
      sessionStorage.setItem('demoKYC', JSON.stringify(demoKYC));

      // Step 3: Navigate to upload page
      setCurrentStep('Redirecting to upload page...');
      setProgress(70);
      await sleep(600);

      setProgress(100);
      setCurrentStep('Demo ready!');

      await sleep(500);

      toast.success('Demo mode activated! Sample documents ready to seal.');

      // Navigate to upload page
      router.push('/upload?demo=true');

      if (onDemoComplete) {
        onDemoComplete();
      }
    } catch (error) {
      console.error('Demo mode error:', error);
      toast.error('Failed to start demo mode');
      setIsRunning(false);
      setProgress(0);
    }
  }

  function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  if (isRunning) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <p className="text-sm font-medium text-gray-700">{currentStep}</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-gray-500">
              Setting up your demo experience...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      size="lg"
      onClick={runDemo}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <Sparkles className="w-5 h-5 mr-2" />
      Try Interactive Demo
    </Button>
  );
}

// Compact version for smaller spaces
export function CompactDemoButton({ onDemoComplete }: DemoModeButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function quickDemo() {
    setIsLoading(true);

    const demoDocuments = generateDemoDocumentSet();
    const demoKYC = generateDemoKYCData();

    sessionStorage.setItem('demoMode', 'true');
    sessionStorage.setItem('demoDocuments', JSON.stringify(demoDocuments));
    sessionStorage.setItem('demoKYC', JSON.stringify(demoKYC));

    await new Promise(resolve => setTimeout(resolve, 500));

    router.push('/upload?demo=true');

    if (onDemoComplete) {
      onDemoComplete();
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={quickDemo}
      disabled={isLoading}
      className="border-blue-300 text-blue-700 hover:bg-blue-50"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      Demo Mode
    </Button>
  );
}
