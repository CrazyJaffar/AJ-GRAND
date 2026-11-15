import React, { useState } from 'react';
import { Building2 } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  lazy?: boolean;
  objectPosition?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle = 'AJ GRAND',
  lazy = true,
  objectPosition = 'center',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center bg-[#eae8e5] text-[#4d463c] p-6 text-center border border-[#e8e2d9]"
      >
        <Building2 className="w-8 h-8 text-[#725b38] mb-3" strokeWidth={1.5} />
        <p className="font-editorial text-lg text-[#1b1c1a]">{fallbackTitle}</p>
        <p className="text-xs text-[#605e5c] mt-1 max-w-xs">{alt}</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      referrerPolicy="no-referrer"
      style={{ objectPosition }}
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
