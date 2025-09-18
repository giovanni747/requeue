# Requeue

A modern, feature-rich Next.js application built with TypeScript, Tailwind CSS, and a comprehensive UI component library. Requeue provides a sleek, responsive interface with advanced animations, user management, and social features.

## ✨ Features

- **🚀 Next.js 15** - Built with the latest Next.js App Router and Turbopack
- **⚡ TypeScript** - Fully typed for better development experience and reliability
- **🎨 Tailwind CSS v4** - Modern utility-first CSS framework with latest features
- **🧩 shadcn/ui** - Beautiful, accessible, and customizable UI components
- **🌙 Dark Mode** - Built-in dark mode support with smooth transitions
- **📱 Responsive Design** - Mobile-first responsive layout that works on all devices
- **🔐 Authentication** - Integrated Clerk authentication system
- **🗄️ Database** - Neon PostgreSQL database with serverless architecture
- **🎭 Animations** - Framer Motion and GSAP for smooth, engaging animations
- **🎪 Magic UI** - Custom animated components for enhanced user experience
- **👥 Social Features** - User following, suggestions, and social interactions
- **🎯 Modern Stack** - Latest React 19, Next.js 15, and cutting-edge tools

## 🛠️ Tech Stack

### Core Framework
- [Next.js 15](https://nextjs.org/) - React framework with App Router
- [React 19](https://react.dev/) - Latest React with concurrent features
- [TypeScript 5](https://www.typescriptlang.org/) - Static type checking

### Styling & UI
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Accessible UI component library
- [Radix UI](https://www.radix-ui.com/) - Headless UI primitives
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [GSAP](https://greensock.com/gsap/) - Professional animation library

### Database & Authentication
- [Neon](https://neon.tech/) - Serverless PostgreSQL database
- [Clerk](https://clerk.com/) - Authentication and user management
- [Postgres](https://node-postgres.com/) - PostgreSQL client

### Development Tools
- [ESLint](https://eslint.org/) - Code linting
- [Turbopack](https://turbo.build/pack) - Fast bundler for development
- [Lucide React](https://lucide.dev/) - Beautiful icon library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

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
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL=your_neon_database_url
   
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
requeue/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   └── welcome/            # Welcome page
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── avatar.tsx      # User avatar component
│   │   │   ├── button.tsx      # Button variants
│   │   │   ├── card.tsx        # Card container
│   │   │   ├── dialog.tsx      # Modal dialogs
│   │   │   ├── input.tsx       # Form inputs
│   │   │   ├── sidebar.tsx     # Sidebar navigation
│   │   │   └── ...             # More UI components
│   │   ├── magicui/            # Custom animated components
│   │   │   ├── animated-theme-toggler.tsx
│   │   │   ├── particles.tsx
│   │   │   └── shine-border.tsx
│   │   ├── app-sidebar.tsx     # Main app sidebar
│   │   ├── FollowButton.tsx    # User follow functionality
│   │   ├── SuggestedUsers.tsx  # User recommendations
│   │   ├── Stack.tsx           # Animated stack component
│   │   └── user-sync.tsx       # User synchronization
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-media-query.tsx # Media query hook
│   │   └── use-mobile.ts       # Mobile detection hook
│   ├── lib/                    # Utility functions
│   │   ├── actions.ts          # Server actions
│   │   ├── db.ts              # Database utilities
│   │   └── utils.ts           # General utilities
│   └── middleware.ts           # Next.js middleware
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── check-table.sql            # Database schema check
└── test-db.js                 # Database testing script
```

## 🎨 Available Components

### Core UI Components
- **Button** - Multiple variants and sizes
- **Card** - Container with header, content, and footer
- **Input** - Form input with validation states
- **Label** - Accessible form labels
- **Avatar** - User profile pictures
- **Checkbox** - Custom checkbox component
- **Switch** - Toggle switch component
- **Separator** - Visual content dividers

### Layout Components
- **Sidebar** - Collapsible navigation sidebar
- **Dialog** - Modal dialogs and popups
- **Drawer** - Mobile-friendly slide-out panels
- **Sheet** - Bottom sheet components
- **Tooltip** - Contextual information tooltips

### Custom Components
- **FollowButton** - User follow/unfollow functionality
- **SuggestedUsers** - User recommendation system
- **Stack** - Animated card stack component
- **ShinyText** - Animated text effects
- **AppSidebar** - Main application navigation

### Magic UI Components
- **AnimatedThemeToggler** - Smooth theme switching
- **Particles** - Interactive particle effects
- **ShineBorder** - Animated border effects

### Adding More Components
```bash
npx shadcn@latest add [component-name]
```

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 🗄️ Database Setup

The application uses Neon PostgreSQL. To set up the database:

1. Create a Neon account and database
2. Copy the connection string to your `.env.local`
3. Run the database check script:
   ```bash
   node test-db.js
   ```

## 🎯 Deployment

### Vercel (Recommended)
The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### Other Platforms
- **Netlify** - Static site deployment
- **Railway** - Full-stack deployment
- **AWS** - Custom server setup

Check the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🎨 Customization

### Theming
- Modify `tailwind.config.ts` for custom colors and themes
- Update `src/app/globals.css` for global styles
- Customize component variants in individual component files

### Adding Features
- Create new components in `src/components/`
- Add server actions in `src/lib/actions.ts`
- Extend database schema as needed

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint for code quality
- Write meaningful commit messages
- Test your changes thoroughly

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the amazing component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first approach
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Clerk](https://clerk.com/) for authentication
- [Neon](https://neon.tech/) for serverless database

---

**Built with ❤️ by [Giovanni Sanchez](https://github.com/giovanni747)**