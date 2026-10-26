import React from 'react';

interface CropVisualProps {
  visualType: string;
  className?: string;
}

/**
 * High-contrast, domain-authentic vector botanical illustrations for Bangladeshi crops.
 * Ensures zero broken images and crisp visual distinction across cards.
 */
export const CropVisualCard: React.FC<CropVisualProps> = ({ visualType, className = 'w-14 h-14' }) => {
  switch (visualType) {
    case 'paddy':
    case 'rice':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-br from-[#166534] to-[#14532D] flex items-center justify-center text-[#DCFCE7] shrink-0 shadow-xs`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 48 48" className="w-8 h-8 fill-none stroke-current" strokeWidth="2.2">
            <path d="M24 42V10" strokeLinecap="round" />
            <path d="M24 18C18 18 14 14 14 8C20 8 24 12 24 18Z" fill="#86EFAC" fillOpacity="0.3" />
            <path d="M24 22C30 22 34 18 34 12C28 12 24 16 24 22Z" fill="#FDE047" fillOpacity="0.4" />
            <path d="M24 28C18 28 14 24 14 18C20 18 24 22 24 28Z" fill="#FDE047" fillOpacity="0.4" />
            <path d="M24 32C30 32 34 28 34 22C28 22 24 26 24 32Z" fill="#86EFAC" fillOpacity="0.3" />
            <path d="M16 42C16 34 20 28 24 26C28 28 32 34 32 42" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'potato':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-br from-[#92400E] to-[#78350F] flex items-center justify-center text-[#FEF3C7] shrink-0 shadow-xs`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 48 48" className="w-8 h-8 fill-none stroke-current" strokeWidth="2.2">
            <ellipse cx="22" cy="26" rx="13" ry="9" transform="rotate(-15 22 26)" fill="#FDE68A" fillOpacity="0.35" />
            <ellipse cx="30" cy="30" rx="9" ry="6.5" transform="rotate(12 30 30)" fill="#F59E0B" fillOpacity="0.35" />
            <circle cx="19" cy="24" r="1" fill="currentColor" />
            <circle cx="25" cy="27" r="1" fill="currentColor" />
            <circle cx="31" cy="29" r="1" fill="currentColor" />
          </svg>
        </div>
      );

    case 'mustard':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-br from-[#CA8A04] to-[#854D0E] flex items-center justify-center text-[#FEF9C3] shrink-0 shadow-xs`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 48 48" className="w-8 h-8 fill-none stroke-current" strokeWidth="2.2">
            <circle cx="24" cy="24" r="4" fill="#FDE047" />
            <circle cx="24" cy="14" r="5" fill="#FEF08A" fillOpacity="0.4" />
            <circle cx="24" cy="34" r="5" fill="#FEF08A" fillOpacity="0.4" />
            <circle cx="14" cy="24" r="5" fill="#FEF08A" fillOpacity="0.4" />
            <circle cx="34" cy="24" r="5" fill="#FEF08A" fillOpacity="0.4" />
          </svg>
        </div>
      );

    case 'onion':
    case 'garlic':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-br from-[#881337] to-[#4C0519] flex items-center justify-center text-[#FFE4E6] shrink-0 shadow-xs`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 48 48" className="w-8 h-8 fill-none stroke-current" strokeWidth="2.2">
            <path d="M24 10C24 16 12 20 12 30C12 36.6 17.4 40 24 40C30.6 40 36 36.6 36 30C36 20 24 16 24 10Z" fill="#FDA4AF" fillOpacity="0.3" />
            <path d="M24 10V6M21 9L19 5M27 9L29 5" strokeLinecap="round" />
            <path d="M20 40L19 43M24 40V44M28 40L29 43" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'brinjal':
    case 'tomato':
    case 'chili':
    case 'cauliflower':
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-br from-[#15803D] to-[#166534] flex items-center justify-center text-[#DCFCE7] shrink-0 shadow-xs`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 48 48" className="w-8 h-8 fill-none stroke-current" strokeWidth="2.2">
            <path d="M16 22C16 16 20 14 24 14C28 14 32 16 32 22C32 30 28 38 24 38C20 38 16 30 16 22Z" fill="#86EFAC" fillOpacity="0.3" />
            <path d="M20 14L24 9L28 14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M24 9V6" strokeLinecap="round" />
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`${className} rounded-xl bg-gradient-to-br from-[#166534] to-[#14532D] flex items-center justify-center text-[#DCFCE7] shrink-0 shadow-xs`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 48 48" className="w-8 h-8 fill-none stroke-current" strokeWidth="2.2">
            <path d="M24 40V18" strokeLinecap="round" />
            <path d="M24 28C16 28 10 22 10 14C18 14 24 20 24 28Z" fill="#86EFAC" fillOpacity="0.35" />
            <path d="M24 22C32 22 38 16 38 8C30 8 24 14 24 22Z" fill="#86EFAC" fillOpacity="0.35" />
          </svg>
        </div>
      );
  }
};
