import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface JsonViewerProps {
  data: unknown;
  maxHeight?: string;
  copyLabel?: string;
}

export function JsonViewer({ data, maxHeight = '320px', copyLabel = 'Copy' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may be unavailable in HTTP or sandboxed contexts
    }
  };

  return (
    <div className="relative">
      <pre
        className="overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed"
        style={{ maxHeight }}
      >
        {json}
      </pre>
      <Button
        size="icon-xs"
        variant="ghost"
        className="absolute right-2 top-2"
        onClick={handleCopy}
        aria-label={copyLabel}
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </Button>
    </div>
  );
}
