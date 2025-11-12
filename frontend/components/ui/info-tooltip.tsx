import { Info, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  term: string;
  definition: string;
  example?: string;
  whenToUse?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  inline?: boolean; // Show term inline with dotted underline
}

/**
 * InfoTooltip - Displays detailed explanations for technical terms
 *
 * Usage:
 * <InfoTooltip
 *   term="ETID"
 *   definition="A unique identifier for the type of data stored in Walacor blockchain"
 *   example="100001 for loan documents, 100002 for provenance records"
 * />
 */
export function InfoTooltip({
  term,
  definition,
  example,
  whenToUse,
  side = 'top',
  className,
  inline = false
}: InfoTooltipProps) {

  const tooltipContent = (
    <div className="space-y-2 max-w-sm">
      <p className="font-semibold text-sm border-b border-gray-200 pb-1">
        {term}
      </p>
      <p className="text-xs leading-relaxed text-gray-700">
        {definition}
      </p>
      {example && (
        <div className="bg-blue-50 border-l-2 border-blue-400 p-2 rounded">
          <p className="text-xs font-medium text-blue-900">💡 Example:</p>
          <p className="text-xs text-blue-800 mt-1">{example}</p>
        </div>
      )}
      {whenToUse && (
        <div className="bg-green-50 border-l-2 border-green-400 p-2 rounded">
          <p className="text-xs font-medium text-green-900">📌 When to use:</p>
          <p className="text-xs text-green-800 mt-1">{whenToUse}</p>
        </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <span className={cn(
              'inline-flex items-center gap-1 cursor-help border-b border-dotted border-gray-400',
              'hover:border-blue-500 hover:text-blue-600 transition-colors',
              className
            )}>
              {term}
              <Info className="w-3 h-3 text-gray-400" />
            </span>
          </TooltipTrigger>
          <TooltipContent side={side} className="max-w-md">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center ml-1',
              'text-gray-400 hover:text-blue-600 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full',
              className
            )}
            aria-label={`Learn more about ${term}`}
          >
            <Info className="w-4 h-4" />
            <span className="sr-only">Learn more about {term}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-md">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * TermWithTooltip - Inline term with integrated tooltip
 *
 * Usage:
 * <TermWithTooltip term="ETID" definition="..." example="..." />
 */
export function TermWithTooltip(props: Omit<InfoTooltipProps, 'inline'>) {
  return <InfoTooltip {...props} inline={true} />;
}
