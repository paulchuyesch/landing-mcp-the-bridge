"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { primaryNavLinks } from "../../lib/site-navigation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <nav className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between gap-4">
        <a href="/" className="flex items-center py-1 shrink-0" aria-label="THE BRIDGE inicio">
          <img
            src="/logo.svg"
            alt="THE BRIDGE"
            className="h-8 md:h-11 w-auto"
            width={194}
            height={48}
            fetchPriority="high"
          />
        </a>

        <div className="hidden xl:flex items-center gap-5 lg:gap-6">
          {primaryNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-3 shrink-0">
          <a
            href="/descargar"
            className="h-9 px-4 inline-flex items-center justify-center border border-orange-500 bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 hover:border-orange-600 transition-colors"
          >
            Descargar plugin
          </a>
        </div>

        <button
          className="xl:hidden p-2 text-foreground-muted hover:text-foreground"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Abrir menú"
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {isOpen && (
        <div className="xl:hidden border-t border-border bg-background animate-menu-open">
          <div className="container mx-auto px-6 py-4 flex flex-col gap-3">
            {primaryNavLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-foreground-muted hover:text-foreground transition-colors py-1"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/descargar"
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 h-10 px-4 inline-flex items-center justify-center border border-orange-500 bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 hover:border-orange-600 transition-colors"
            >
              Descargar plugin
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
