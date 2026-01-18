# VenueHub - Sports Venue Management System

## Overview

VenueHub is a complete sports venue booking and management system designed for sports facility owners and receptionists. It provides real-time court/turf booking management, customer relationship management, financial tracking, and a mobile companion mode for QR code scanning during check-ins.

The system is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence and WebSockets for real-time updates across devices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScriptv
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with HMR support
- **Progressive Web App**: Configured with manifest.json for mobile "Companion Mode" - allows installation on phone home screens for QR scanning

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful JSON API endpoints under `/api/*`
- **Real-time Communication**: WebSocket server (ws library) on `/ws` path for instant updates across devices
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

### Key Design Patterns
1. **Desktop-First, Mobile-Companion**: Primary workspace on large screens with fixed sidebar navigation; mobile view optimized for QR scanning and quick actions
2. **Real-Time Sync**: WebSocket broadcasts ensure laptop dashboard updates instantly when mobile device scans a QR code
3. **Shared Types**: Schema defined once in `shared/` directory, used by both client and server
4. **Storage Interface**: Abstract `IStorage` interface in `server/storage.ts` allows swapping storage implementations

### Application Modules
- **Dashboard**: Command center with live court status, metrics, and quick actions
- **Bookings**: Interactive calendar with color-coded booking statuses, slot blocking
- **Customers**: CRM with customer database, tags (VIP, HIGH_RISK), booking history
- **Financials**: Transaction logs, expense tracking, settlement management
- **Scanner**: QR code scanning for check-ins using device camera (html5-qrcode)
- **Tournaments**: Tournament and team management
- **Waitlist**: Customer waitlist for fully booked slots

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### UI Framework
- **Radix UI**: Headless component primitives (dialogs, dropdowns, tabs, etc.)
- **shadcn/ui**: Pre-styled components using Radix + Tailwind
- **Recharts**: Data visualization for analytics dashboards
- **Lucide React**: Icon library

### File Upload
- **Uppy**: File upload handling with AWS S3 integration capability

### QR Code
- **html5-qrcode**: Camera-based QR code scanning for mobile companion mode
- **qrcode.react**: QR code generation for booking tickets

### Form Handling
- **React Hook Form**: Form state management
- **Zod**: Schema validation (integrated with Drizzle via drizzle-zod)

### Date/Time
- **date-fns**: Date manipulation and formatting

### Notifications (Stubbed)
- **WhatsApp Business API**: Placeholder for booking confirmations and reminders (integration points defined but requires external API configuration)

### Build & Development
- **Vite**: Frontend build and dev server
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development