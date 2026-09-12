import React from 'react';
import { Zap } from 'lucide-react';

interface BrandLogoProps {
  compact?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ compact = false, className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-sky-active text-white shadow-lg shadow-primary/20">
      <Zap size={22} />
    </div>
    {!compact && <span className="text-2xl font-extrabold tracking-tight text-primary">BroFocus</span>}
  </div>
);

export default BrandLogo;
