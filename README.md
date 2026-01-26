# BTR Directory

A comprehensive Next.js application for cataloging UK Build-to-Rent developments, operators, asset owners, and suppliers.

## Features

- **Multifamily & Single Family Directories**: Browse and filter BTR developments
- **Operator & Asset Owner Profiles**: Detailed company information
- **Supplier Directory**: Find BTR industry service providers
- **Advanced Filtering**: Search by location, units, amenities, status
- **Newsletter Signup**: Stay updated with BTR market insights
- **Form Submissions**: Submit corrections and add suppliers
- **SEO Optimized**: Meta tags and Open Graph support
- **Responsive Design**: Mobile-first, fully responsive UI
- **Type-Safe**: Built with TypeScript

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Forms**: React Hook Form
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd btr-directory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. In the SQL Editor, run the schema from `database/schema.sql`

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace with your actual Supabase credentials from step 3.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 6. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
btr-directory/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Homepage
│   ├── multifamily/              # Multifamily directory
│   ├── single-family/            # Single family directory
│   ├── development/[slug]/       # Development detail pages
│   ├── asset-owners/             # Asset owners directory
│   ├── operators/                # Operators directory
│   ├── suppliers/                # Suppliers directory
│   ├── submit-correction/        # Correction form
│   ├── submit-supplier/          # Supplier submission form
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── layout/                   # Header, Footer
│   ├── ui/                       # Button, Card, Badge
│   ├── forms/                    # Form components
│   ├── filters/                  # Filter components
│   └── cards/                    # Card components
├── lib/                          # Utilities
│   ├── supabase.ts              # Supabase client
│   └── utils.ts                 # Helper functions
├── types/                        # TypeScript types
│   └── database.ts              # Database types
├── database/                     # Database schema
│   └── schema.sql               # SQL schema
├── public/                       # Static assets
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── next.config.ts               # Next.js configuration
```

## Database Schema

The application uses the following main tables:

- **developments**: BTR development properties
- **asset_owners**: Property investment companies
- **operators**: Property management companies
- **suppliers**: Service providers
- **correction_requests**: User-submitted corrections
- **supplier_submissions**: New supplier applications
- **newsletter_signups**: Email subscriptions

See `database/schema.sql` for the complete schema.

## Key Features Implementation

### Filtering & Search

- Real-time client-side filtering
- Server-side Supabase queries for initial data
- Filter by development type, status, location, units, amenities

### Forms

- Newsletter signup with email validation
- Correction request submission
- Supplier submission form
- Success/error state handling

### SEO

- Dynamic metadata for each page
- Open Graph tags for social sharing
- Semantic HTML structure

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Vercel

Add the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Customization

### Colors

Edit `tailwind.config.ts` to change the color scheme:

```typescript
colors: {
  primary: {
    blue: "#5B8DBE",
    // ...
  },
  // ...
}
```

### Content

- Update homepage content in `app/page.tsx`
- Modify footer links in `components/layout/Footer.tsx`
- Adjust header navigation in `components/layout/Header.tsx`

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

ISC License

## Support

For questions or support, contact: info@btrdirectory.com
