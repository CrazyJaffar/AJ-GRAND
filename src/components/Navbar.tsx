import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onNavigateHomeSection: (sectionId: string) => void;
  onScheduleVisitClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateHomeSection,
  onScheduleVisitClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Residences', target: 'residences' },
    { label: 'Floors', target: 'floors' },
    { label: 'Amenities', target: 'amenities' },
    { label: 'Location', target: 'location' },
    { label: 'Enquire', target: 'enquire' },
  ];

  const handleNav = (target: string) => {
    setMobileMenuOpen(false);
    onNavigateHomeSection(target);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fbf9f6]/95 backdrop-blur-sm border-b border-[#e8e2d9]">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 h-16 md:h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('top');
          }}
          className="font-editorial text-2xl md:text-[1.65rem] tracking-[0.06em] text-[#1a1918] whitespace-nowrap shrink-0 hover:text-[#725b38] transition-colors"
        >
          AJ GRAND
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#4d463c]"
        >
          {navLinks.map((link) => (
            <button
              key={link.target}
              type="button"
              onClick={() => handleNav(link.target)}
              className="whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-[#c5a880] hover:text-[#1a1918] transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 Primary CTA button + mobile menu trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onScheduleVisitClick();
            }}
            className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] hover:bg-[#725b38] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
          >
            Schedule Visit
          </button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 border border-[#e8e2d9] rounded-[4px] text-[#1a1918] hover:bg-[#f5f3f0] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#e8e2d9] bg-[#fbf9f6] px-5 py-5">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <button
                key={link.target}
                type="button"
                onClick={() => handleNav(link.target)}
                className="w-full text-left py-3 px-2 text-base font-medium text-[#1a1918] border-b border-[#e8e2d9]/60 hover:text-[#725b38] transition-colors cursor-pointer min-h-[44px]"
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onScheduleVisitClick();
              }}
              className="mt-4 w-full py-3 px-6 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border-b-2 border-[#c5a880] rounded-[4px] min-h-[44px] cursor-pointer"
            >
              Schedule Private Visit
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
