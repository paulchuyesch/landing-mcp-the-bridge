import { footerSections, legalLinks } from "../../lib/site-navigation";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background-secondary">
      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr] border-b border-border pb-10">
          <div>
            <a href="/" className="inline-flex items-center" aria-label="THE BRIDGE inicio">
              <img src="/logo.svg" alt="THE BRIDGE" className="h-7 w-auto" width={136} height={34} />
            </a>
            <p className="mt-4 max-w-sm text-sm text-foreground-muted leading-relaxed">
              Infraestructura AEO para conectar e-commerce y agentes IA con datos confiables y operaciones seguras.
            </p>
            <a
              href="/descargar"
              className="mt-6 inline-flex h-11 px-6 items-center justify-center border border-orange-500 bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Descargar plugin
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {footerSections.map((section) => (
              <div key={section.title}>
                <p className="type-micro text-xs uppercase text-foreground-subtle mb-4">{section.title}</p>
                <ul className="space-y-3 text-sm">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href} className="text-foreground-muted hover:text-foreground transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground-subtle">
            {legalLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <p className="text-[10px] text-foreground-subtle opacity-35 whitespace-nowrap">
            © 2026 Edinson Johender · Licenciado bajo {" "}
            <a
              href="https://github.com/edinsonjohender/venore-landing-astro/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              AGPL-3.0
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
