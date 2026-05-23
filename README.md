# Link Preview App

A full-stack web application for storing, organizing, and beautifully previewing your favorite web links using OpenGraph cards. Built with **Next.js**, **TypeScript**, TailwindCSS, and modern component-driven design. Authenticated storage and categorization leverages Supabase.

## Features

- **Store and Organize Links:** Save your favorite sites and organize them into categories.
- **OpenGraph Previews:** View links as rich cards with title, description, images, and site names.
- **YouTube Support:** Enhanced embed and preview for YouTube links via oEmbed.
- **User Authentication:** Secure login and per-user storage using Supabase.
- **Category Management:** Create, list, and manage categories ('default' and user-defined) for links.
- **Sorting/Filtering:** Sort by creation date or title; filter links by category.
- **Responsive & Themeable UI:** Supports system/dark mode using TailwindCSS and [shadcn/ui](https://ui.shadcn.com/).
- **XSS-Safe:** Robust scraping and sanitization logic to prevent injection.

## Tech Stack

- **Frontend:** Next.js 16+, TypeScript, React 19, TailwindCSS, shadcn/ui, Lucide icons, Radix UI
- **Backend/API:** Next.js Route Handlers, Supabase (for auth/storage), Cheerio (web scraping)
- **Security:** DOMPurify, custom sanitize utilities; strong validation throughout.
- **Other:** pnpm for package management, extensive config for theming and linting.

## Getting Started

### Development

```bash
pnpm install
pnpm dev
# Or use: npm run dev | yarn dev | bun dev
```

Preview at [http://localhost:3000](http://localhost:3000). Start editing `app/page.tsx` for customizations.

### Environment Variables

Your project requires the following environment variables (setup for Supabase):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Project Layout

```
.
├── app/
│   ├── api/           # Route Handlers (REST endpoints for links, categories)
│   ├── layout.tsx     # Root layout, theming, metadata
│   ├── page.tsx       # Main app UI
│   ├── globals.css    # TailwindCSS/global styles
├── components/        # React components (e.g., LinkPreview.tsx)
├── lib/               # Utility libraries (e.g., sanitize.ts)
├── utils/             # Supabase helpers
├── public/            # Static assets (images, robots.txt)
├── package.json       # Scripts/dependencies
├── tsconfig.json      # TypeScript config
```

### Notable Endpoints

- `POST /api/links`: Add a new link (OpenGraph scraping with XSS protection, YouTube special support)
- `GET /api/links`: Fetch user links (with sorting/filtering)
- `GET /api/categories`: List available categories
- `POST /api/categories`: Create new category

### Security

Custom utility at `lib/sanitize.ts` ensures all user/scraped content is sanitized, protecting DB and UI from XSS.

### Styling & Theming

- Theme managed via CSS variables in `globals.css` and contextual Tailwind classes.
- Built-in support for light/dark mode and custom color theming.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Radix UI](https://www.radix-ui.com/)

---

**License**: MIT (see LICENSE, if present)
