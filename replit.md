# Staff Punch Data Processor

## Overview

This is a full-stack web application designed to process staff punch data from Excel files and match punch records to appropriate shifts. The application handles complex scenarios including overnight shifts that span multiple days, provides real-time processing feedback, and generates comprehensive reports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (@tanstack/react-query) for server state management
- **Routing**: Wouter for client-side routing
- **Real-time Updates**: WebSocket integration for live processing updates

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **File Processing**: XLSX library for Excel file parsing
- **WebSocket**: Built-in WebSocket server for real-time communication
- **Session Management**: In-memory storage with session-based isolation

## Key Components

### Data Processing Pipeline
1. **File Upload**: Handles Excel file uploads with drag-and-drop interface
2. **Data Validation**: Validates punch records against expected schema
3. **Shift Matching**: Intelligent algorithm to match punch-ins to appropriate shifts
4. **Processing Engine**: Handles overnight shifts, grace periods, and late arrivals
5. **Export System**: Generates Excel/CSV reports with customizable options

### Core Business Logic
- **Shift Management**: CRUD operations for shift definitions
- **Punch Record Processing**: Matches check-ins to shifts with 15-minute grace period
- **Overnight Shift Handling**: Special logic for shifts crossing midnight
- **Status Classification**: Categorizes punches as On-Time, Late, or Unmatched

### User Interface Components
- **Progress Indicator**: 4-step workflow visualization
- **File Upload**: Drag-and-drop Excel file processing
- **Shift Management**: Dynamic shift configuration interface
- **Results Table**: Paginated, filterable results with inline editing
- **Statistics Dashboard**: Real-time processing statistics
- **Export Options**: Multiple format support with filtering options

## Data Flow

1. **Upload Phase**: User uploads Excel file → Server parses and validates data → Records stored in database
2. **Configuration Phase**: User manages shift definitions and processing settings
3. **Processing Phase**: Server processes punch records → Matches to shifts → Updates via WebSocket → Results stored
4. **Export Phase**: User configures export options → Server generates file → Download initiated

### Database Schema
- **shifts**: Shift definitions with start/end times and overnight flags
- **punchRecords**: Raw punch data from Excel files
- **processedRecords**: Processed results with shift matches and status
- **processingSettings**: Configuration like grace period settings

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database queries and migrations
- **multer**: File upload handling
- **xlsx**: Excel file parsing and generation
- **ws**: WebSocket server implementation

### UI Libraries
- **@radix-ui/***: Accessible UI primitive components
- **react-dropzone**: File upload drag-and-drop functionality
- **date-fns**: Date manipulation utilities
- **lucide-react**: Icon library

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` starts development server with hot reload
- **Database**: Uses Drizzle push for schema synchronization
- **WebSocket**: Integrated with Vite dev server

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles Node.js server code
- **Database**: Drizzle migrations handle schema changes
- **Environment**: Uses DATABASE_URL environment variable

### Session Management
- **Strategy**: Session-based isolation using generated session IDs
- **Storage**: In-memory storage for development (can be extended to persistent storage)
- **Cleanup**: Automatic session data cleanup capabilities

### Real-time Features
- **WebSocket**: Provides live processing updates
- **Progress Tracking**: Real-time progress bars during processing
- **Error Handling**: Graceful error recovery with user feedback

The application is designed to be robust, scalable, and user-friendly, with particular attention to handling complex business rules around shift scheduling and time zone considerations.