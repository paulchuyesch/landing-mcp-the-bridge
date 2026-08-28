# VERONICA Landing Page

> **The Context Layer for Autonomous Engineering**

A high-performance, modern landing page built with Astro, React, and TypeScript. Features an optimized PageSpeed score (98%), animated SVG visualizations, and a fully responsive design.

[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-5865F2?style=flat-square&logo=anthropic)](https://claude.ai/claude-code)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg?style=flat-square)](https://www.gnu.org/licenses/agpl-3.0)
[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?style=flat-square&logo=astro)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

## Demo

**Live Site:** [www.venore.app](https://www.venore.app)

## Features

- **98% PageSpeed Score** - Optimized for performance
- **Animated SVG Grid** - Collaborative cursors with smooth animations
- **Fully Responsive** - Mobile-first design with adaptive layouts
- **Smart Carousel** - Optimized 4-step How It Works section
- **Waitlist Integration** - API-ready email collection
- **Blog System** - Markdown-based content management
- **Dark Theme** - Modern monochrome design
- **Accessible** - WCAG compliant components
- **Static Site Generation** - Lightning-fast page loads

## Project Structure

```
veronica-landing/
├── public/                      # Static assets (images, fonts)
│   ├── og-image.jpg            # Open Graph preview image
│   └── favicon.svg             # Site favicon
│
├── src/
│   ├── components/
│   │   ├── sections/           # Page sections
│   │   │   ├── Hero.tsx        # Hero with animated grid
│   │   │   ├── Navbar.tsx      # Navigation bar
│   │   │   ├── Features.astro  # Features showcase
│   │   │   ├── HowItWorks.astro # 4-step carousel
│   │   │   ├── BlogPreview.astro # Latest blog posts
│   │   │   ├── CTA.tsx         # Call to action
│   │   │   └── Footer.tsx      # Site footer
│   │   │
│   │   ├── svg/                # SVG components
│   │   │   └── IsometricGrid.tsx # Animated grid visualization
│   │   │
│   │   └── ui/                 # Reusable UI components
│   │       ├── button.tsx      # Button component
│   │       └── ImagePlaceholder.astro # Image placeholder
│   │
│   ├── hooks/                  # React hooks
│   │   └── useWaitlist.ts      # Waitlist form logic
│   │
│   ├── layouts/
│   │   └── Layout.astro        # Base HTML layout
│   │
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── blog/
│   │   │   ├── index.astro     # Blog listing
│   │   │   └── [...slug].astro # Blog post template
│   │   │
│   │   └── api/
│   │       └── waitlist.ts     # Waitlist API endpoint
│   │
│   ├── content/
│   │   ├── config.ts           # Content collections config
│   │   └── blog/               # Blog posts (Markdown)
│   │       ├── how-venore-works.md
│   │       ├── the-ocean-visual-language.md
│   │       ├── the-small-dream-behind-venore.md
│   │       └── research-notes-context-systems.md
│   │
│   ├── styles/
│   │   └── global.css          # Global styles & animations
│   │
│   └── lib/
│       └── utils.ts            # Utility functions
│
├── astro.config.mjs            # Astro configuration
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment config
└── package.json                # Dependencies & scripts
```

## Tech Stack

### Core
- **[Astro 5.x](https://astro.build)** - Static Site Generator
- **[React 19.x](https://react.dev)** - UI Components (Islands Architecture)
- **[TypeScript](https://www.typescriptlang.org/)** - Type Safety

### Styling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS
- **Custom CSS Animations** - GPU-accelerated SVG animations

### Deployment
- **[Vercel](https://vercel.com)** - Hosting & CDN
- **Static Output** - Pre-rendered HTML for max performance

### APIs & Features
- **Content Collections** - Type-safe Markdown blog
- **RSS Feed** - Automated blog feed generation
- **API Routes** - Serverless waitlist endpoint

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/edinsonjohender/venore-landing-astro.git
cd venore-landing-astro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
```

Edit `.env` and add your configuration:
```env
# Scanner: must match the public landing origin exactly.
SCAN_ALLOWED_ORIGIN=https://landing-mcp-the-bridge.vercel.app

# Brevo (for waitlist)
BREVO_API_KEY=your_brevo_api_key
BREVO_LIST_ID=2
WAITLIST_RATE_LIMIT_WINDOW_MS=3600000
WAITLIST_RATE_LIMIT_EMAIL_MAX=3
WAITLIST_RATE_LIMIT_IP_MAX=10
WAITLIST_RATE_LIMIT_GLOBAL_MAX=100
WAITLIST_TRUST_PROXY=false
WAITLIST_CLIENT_IP_HEADER=cf-connecting-ip
```

When moving the landing to a custom domain, update `SCAN_ALLOWED_ORIGIN` in Vercel to that exact `https` origin before deploying the scanner.

Keep `WAITLIST_TRUST_PROXY=false` unless the deployment is behind a trusted proxy/CDN that strips client-supplied forwarded headers. When enabled, `WAITLIST_CLIENT_IP_HEADER` must point to the trusted provider header.

4. Start development server:
```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) to see the site.

## Available Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run astro` | Run Astro CLI commands |

## Performance

### PageSpeed Insights

- **Desktop:** 98/100
- **Mobile:** 95/100
- **LCP:** < 2.5s
- **TBT:** < 300ms
- **CLS:** < 0.1

### Optimizations

- Static pre-rendering with Astro
- Optimized font loading (preload + media=print trick)
- Lazy loading for images and non-critical components
- GPU-accelerated CSS animations
- Debounced event listeners
- CDN caching (1 year for static assets)

## Key Components

### Animated Isometric Grid

The hero section features a custom SVG grid with:
- 17 connected nodes in 6 island clusters
- Animated data flow lines (stroke-dashoffset)
- 4 collaborative cursors with unique paths
- Smooth 60fps animations

### Smart Carousel

The "How It Works" section uses an optimized carousel:
- Responsive: 1 card on mobile, 2 on desktop
- Smart arrow navigation (full width at edges)
- Debounced resize handler for performance
- Cached calculations for smooth scrolling

### Waitlist Integration

Reusable `useWaitlist` hook with:
- Form validation
- Loading states
- Success/error handling
- API integration ready

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**Key points:**
- Free to use, modify, and distribute
- Must keep source code open if you modify it
- Must maintain attribution to original author
- Cannot make proprietary/closed-source derivatives
- If you host it as a service, you must share your code

See [LICENSE](LICENSE) for the full license text.

### Attribution Requirement

If you use this code, you must include visible attribution:

> "Based on VERONICA Landing Page by Edinson Johender"

This must appear in your footer, credits, or about page.

## Author

**Edinson Johender**

- Built with: [Claude Code](https://claude.ai/claude-code)
- AI Pair Programming: Claude Sonnet 4.5

## Acknowledgments

- Built entirely with [Claude Code](https://claude.ai/claude-code) - AI-powered development assistant
- [Astro](https://astro.build) - Amazing static site framework
- [Vercel](https://vercel.com) - Seamless deployment platform
- [Tailwind CSS](https://tailwindcss.com) - Utility-first styling

---

**Made with Claude Code**
