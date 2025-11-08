import { HelpCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  icon?: 'help' | 'info';
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function HelpTooltip({
  content,
  icon = 'help',
  side = 'top',
  className
}: HelpTooltipProps) {
  const IconComponent = icon === 'help' ? HelpCircle : Info;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center',
              'text-gray-400 hover:text-gray-600 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full',
              className
            )}
          >
            <IconComponent className="w-4 h-4" />
            <span className="sr-only">Help</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {typeof content === 'string' ? (
            <p className="text-sm">{content}</p>
          ) : (
            content
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Preset tooltips for common concepts
export const SecurityLevelTooltips = {
  standard: (
    <div className="space-y-2">
      <p className="font-semibold">Standard Security</p>
      <p className="text-xs">
        SHA-256 hashing with blockchain sealing. Suitable for most documents.
      </p>
      <ul className="text-xs list-disc list-inside space-y-1">
        <li>Fast processing</li>
        <li>Industry-standard encryption</li>
        <li>Cost-effective</li>
      </ul>
    </div>
  ),
  'quantum-safe': (
    <div className="space-y-2">
      <p className="font-semibold">Quantum-Safe</p>
      <p className="text-xs">
        Post-quantum cryptography algorithms resistant to quantum computer attacks.
      </p>
      <ul className="text-xs list-disc list-inside space-y-1">
        <li>Future-proof security</li>
        <li>NIST-approved algorithms</li>
        <li>Quantum-resistant</li>
      </ul>
    </div>
  ),
  maximum: (
    <div className="space-y-2">
      <p className="font-semibold">Maximum Security</p>
      <p className="text-xs">
        Multi-layer encryption with quantum-safe, biometric, and hardware security.
      </p>
      <ul className="text-xs list-disc list-inside space-y-1">
        <li>Military-grade protection</li>
        <li>Multiple verification layers</li>
        <li>Highest compliance level</li>
      </ul>
    </div>
  )
};

export const KYCTooltips = {
  ssn: 'Last 4 digits of Social Security Number for identity verification (US only)',
  idType: 'Type of government-issued identification document',
  idNumber: 'Full identification number from your government ID',
  occupation: 'Your current job title or profession',
  sourceOfFunds: 'Primary source of income or wealth for compliance purposes',
  annualIncome: 'Total yearly income before taxes',
  citizenship: 'Country of citizenship for regulatory compliance'
};

export const BlockchainTooltips = {
  artifactId: 'Unique identifier for your document in the blockchain system',
  walacorTxId: 'Blockchain transaction ID - proof of document sealing',
  proofBundle: 'Cryptographic proof package for offline verification',
  hash: 'Digital fingerprint of your document - changes if tampered',
  timestamp: 'Exact time when document was sealed on blockchain',
  immutable: 'Cannot be altered or deleted once recorded on blockchain'
};
