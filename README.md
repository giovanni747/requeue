# 🚀 Requeue

**Collaborative task management made simple.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-requeue.it.com-blue?style=for-the-badge&logo=vercel)](https://requeue.it.com)

## ✨ Features

- **🎯 Task Management** - Create, assign, and track tasks with real-time updates
- **👥 Team Collaboration** - Invite team members and collaborate in real-time
- **💬 Live Chat** - Communicate with your team using integrated chat
- **📱 Real-time Updates** - WebSocket-powered live updates across all devices
- **🔔 Smart Notifications** - Get notified about mentions, invitations, and task updates
- **📊 Progress Tracking** - Visual progress indicators and completion status
- **🎨 Modern UI** - Beautiful, responsive design with dark mode support
- **🔐 Secure Authentication** - Powered by Clerk for secure user management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS v4, Shadcn/ui
- **Authentication**: Clerk
- **Database**: Neon PostgreSQL
- **Real-time**: Socket.io
- **File Storage**: Cloudinary
- **Email**: Resend
- **Deployment**: Render
- **Animations**: Framer Motion, GSAP

## 🚀 Live Demo

**🌐 [requeue.it.com](https://requeue.it.com)**

Experience the full application with real-time collaboration features!

## 📸 Screenshots

### Dashboard
- Clean, modern interface with task management
- Real-time collaboration features
- Responsive design for all devices

### Authentication
- Custom sign-in/sign-up pages
- Secure authentication flow
- Professional branding

### Real-time Features
- Live chat and notifications
- Collaborative cursors
- Instant updates across devices

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/giovanni747/requeue.git
   cd requeue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL=your_neon_database_url
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Resend Email
   RESEND_API_KEY=your_resend_key
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
requeue/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   ├── room/[id]/      # Room pages
│   │   ├── sign-in/        # Custom auth pages
│   │   └── ...
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   └── ...
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utility functions
│   └── middleware.ts       # Clerk middleware
├── public/                 # Static assets
└── server.js              # Custom server with Socket.io
```

## 🔧 Key Features Explained

### Real-time Collaboration
- **WebSocket Integration**: Powered by Socket.io for instant updates
- **Live Cursors**: See where team members are working in real-time
- **Instant Notifications**: Get notified immediately about mentions and updates

### Task Management
- **Progress Tracking**: Visual progress indicators with completion status
- **Assignment System**: Assign tasks to team members
- **Status Updates**: Track task progress with real-time updates

### Team Features
- **Room-based Organization**: Organize work in dedicated rooms
- **User Invitations**: Invite team members via email or username
- **Follow System**: Follow other users and see their activity

## 🚀 Deployment

The application is deployed on **Render** with the following setup:

- **Custom Domain**: [requeue.it.com](https://requeue.it.com)
- **Database**: Neon PostgreSQL
- **File Storage**: Cloudinary
- **Email Service**: Resend
- **Authentication**: Clerk (Production)

### Environment Variables for Production

Make sure to set these in your deployment platform:

```env
# Production Clerk Keys
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...

# App URLs
NEXT_PUBLIC_APP_URL=https://requeue.it.com
NEXT_PUBLIC_SOCKET_URL=https://requeue.it.com

# Database
DATABASE_URL=your_production_database_url

# Services
RESEND_API_KEY=your_resend_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Giovanni Sanchez**
- GitHub: [@giovanni747](https://github.com/giovanni747)
- LinkedIn: [Giovanni Sanchez](https://www.linkedin.com/in/giovanni-san/)

## 🙏 Acknowledgments

- **Clerk** for authentication
- **Neon** for database hosting
- **Render** for deployment
- **Cloudinary** for file storage
- **Resend** for email services
- **Shadcn/ui** for beautiful components

---

**⭐ Star this repository if you found it helpful!**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-requeue.it.com-blue?style=for-the-badge&logo=vercel)](https://requeue.it.com)
