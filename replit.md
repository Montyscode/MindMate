# MindBridge - AI Psychology Companion

## Overview

MindBridge is a full-stack web application that serves as an AI-powered psychology companion. The platform allows users to take personality assessments (primarily the Big Five personality test) and engage in AI-driven conversations tailored to their personality profiles. The application combines psychological assessment tools with conversational AI to provide personalized insights and support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite for development and bundling
- **Routing**: Wouter for client-side routing with authentication-based route protection
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **Form Handling**: React Hook Form with Zod for validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture with organized route handlers
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect for user management
- **Session Management**: Express session middleware with PostgreSQL session store

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless database
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Database Structure**: 
  - User management (required for Replit Auth)
  - Personality test definitions with JSON question storage
  - Test session tracking for user progress
  - Response collection for detailed analytics
  - Personality result storage with calculated scores
  - AI conversation history for context retention

### Authentication and Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Security**: HTTP-only cookies with secure flags for production
- **Authorization**: Route-level protection with middleware-based user verification

### AI Integration
- **Provider**: OpenAI GPT-5 integration for conversational AI
- **Personalization**: AI responses tailored based on user personality assessment results
- **Context Awareness**: Conversation history and personality profiles inform AI responses
- **Safety**: Built-in guidelines for appropriate psychological support boundaries

## External Dependencies

### Core Services
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **OpenAI API**: GPT-5 model for AI conversation capabilities
- **Replit Auth**: Authentication service for user management and security

### Development Tools
- **Vite**: Frontend build tool with hot module replacement
- **TypeScript**: Static typing for enhanced developer experience
- **Drizzle Kit**: Database schema management and migration tools

### UI and Styling
- **Radix UI**: Accessible component primitives for complex interactions
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Icon library for consistent visual elements

### Validation and Forms
- **Zod**: Schema validation for API inputs and form data
- **React Hook Form**: Form state management with validation integration

### Fonts and Assets
- **Google Fonts**: Inter, Architects Daughter, DM Sans, Fira Code, and Geist Mono for typography variety
- **Custom CSS Properties**: Theme-aware color system and spacing variables