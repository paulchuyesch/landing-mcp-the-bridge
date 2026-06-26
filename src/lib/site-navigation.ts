export interface NavLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: NavLink[];
}

export const primaryNavLinks: NavLink[] = [
  { label: "Producto", href: "/producto" },
  { label: "Cómo funciona", href: "/como-funciona" },
  { label: "Integraciones", href: "/integraciones" },
  { label: "Seguridad", href: "/seguridad" },
  { label: "Casos de uso", href: "/casos-de-uso" },
  // { label: "Docs", href: "/docs" },
];

export const footerSections: FooterSection[] = [
  {
    title: "Producto",
    links: [
      { label: "Producto", href: "/producto" },
      { label: "Cómo funciona", href: "/como-funciona" },
      { label: "Precios", href: "/precios" },
      { label: "Estado", href: "/estado" },
    ],
  },
  {
    title: "Integraciones",
    links: [
      { label: "Visión general", href: "/integraciones" },
      { label: "WooCommerce", href: "/integraciones/woocommerce" },
      { label: "Shopify (Próx.)", href: "/integraciones/shopify" },
      { label: "Descargar plugin", href: "/descargar" },
    ],
  },
  /* Comentado temporalmente por pivot estratégico B2B
  {
    title: "Desarrolladores",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
      { label: "Auth", href: "/docs/auth" },
      { label: "API Reference", href: "/docs/api-reference" },
      { label: "Errores", href: "/docs/errors" },
    ],
  },
  */
  {
    title: "Compañía",
    links: [
      { label: "Casos de uso", href: "/casos-de-uso" },
      { label: "Seguridad", href: "/seguridad" },
      { label: "Contacto", href: "/contacto" },
    ],
  },
];

export const legalLinks: NavLink[] = [
  { label: "Privacidad", href: "/legal/privacidad" },
  { label: "Términos", href: "/legal/terminos" },
  { label: "Licencia", href: "/legal/licencia" },
];
