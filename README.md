# OSRS PvP Performance Tracker Website

A web application for tracking and analyzing PvP performance in Old School RuneScape (OSRS). Built with modern web technologies to provide insights into player statistics and fight analytics.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **Validation:** AJV (JSON Schema validator)
- **Linting:** ESLint

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm, yarn, pnpm, or bun
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

The page auto-updates as you edit files. Start editing `app/page.tsx` to modify the main page.

### Building for Production

```bash
npm run build
npm start
```

The production server will run on `0.0.0.0:3000`.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run lint` - Run ESLint
- `npm run upload:legacy` - Upload legacy fight data (Node.js script)

## Project Structure

- `app/` - Next.js app directory with pages and API routes
- `components/` - Reusable React components
- `public/` - Static assets
- `styles/` - Global styles and Tailwind configuration
- `scripts/` - Utility scripts for data migration and processing

## Features

- Track PvP fight statistics
- Analyze performance metrics
- Legacy fight data import

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

You are free to use, modify, and distribute this software under the terms of the MIT License. This makes the project open-source and available for anyone to use.

## Support

For issues and questions, please open an issue on the GitHub repository.
