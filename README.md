# Lesotho Passport E-Applications System

A complete, production-ready passport application and collection system designed for Lesotho's Ministry of Home Affairs. This system addresses critical challenges in rural environments with mobile-first design, real-time tracking, and decentralized collection points.

## Features

### Core Functionality
- **Secure User Authentication**: Email/password registration with Supabase Auth
- **Step-by-Step Application Wizard**: Intuitive form with validation and file uploads
- **Real-Time Status Tracking**: Live updates via WebSockets with detailed timeline
- **Document Management**: Secure upload and storage of required documents
- **Collection Point Selection**: Multiple locations across all districts
- **QR Code Generation**: Secure collection verification system
- **Admin Dashboard**: Complete application management interface
- **Collection Interface**: Staff portal for processing passport pickups

### Technical Highlights
- **Mobile-First Design**: Optimized for low-bandwidth rural environments
- **Real-Time Updates**: WebSocket integration for live status changes
- **Secure Architecture**: End-to-end encryption, RLS policies, audit trails
- **Scalable Backend**: Microservices-ready with Supabase integration
- **Responsive UI**: Works seamlessly on all devices
- **Production Ready**: Complete error handling, loading states, validation

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **QR Codes**: html5-qrcode
- **Notifications**: Integration ready for Twilio (SMS) and SendGrid (Email)

## Quick Start

1. **Set up Supabase**: Click "Connect to Supabase" in the top right
2. **Run Migrations**: The database schema will be automatically created
3. **Start Development**: `npm run dev`

## Demo Accounts

- **Admin**: admin@lesotho.gov / admin123
- **User**: user@example.com / user123

## Database Schema

### Tables
- `passport_applications`: Core application data with status tracking
- `collection_points`: Available pickup locations across Lesotho
- `application_status_updates`: Complete audit trail
- `notification_logs`: SMS/Email tracking

### Security
- Row Level Security (RLS) enabled on all tables
- User-specific data access policies
- Admin override policies for management
- Automatic status change logging

## Application Workflow

1. **Registration**: User creates account with email verification
2. **Application**: Step-by-step form with document uploads
3. **Processing**: Admin reviews and updates status
4. **Notification**: Automated SMS/Email at each stage
5. **Collection**: QR code verification at chosen location
6. **Completion**: Final status update and archive

## Collection Points

Pre-configured locations across all districts:
- Maseru Central Post Office
- Leribe District Office  
- Mafeteng Municipal Office
- Mohale's Hoek District Center
- Qacha's Nek Border Office
- Thaba-Tseka Mountain Office

## Integration Services

### SMS Notifications (Twilio)
- Automatic status updates
- Collection reminders
- Important announcements

### Email Notifications (SendGrid)
- Detailed status reports
- Document submission confirmations
- Collection instructions

## Security Features

- End-to-end encryption for all data
- Secure file storage with access controls
- QR code verification for collection
- Complete audit trail
- Rate limiting and abuse prevention
- Input validation and sanitization

## Deployment

The system is designed for production deployment with:
- Horizontal scaling capabilities
- CDN integration for global performance
- Monitoring and logging
- Backup and disaster recovery
- Load balancing and failover

Built for the Kingdom of Lesotho with ❤️