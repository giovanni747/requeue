# Requeue

A modern Next.js application built with TypeScript, Tailwind CSS, and shadcn/ui components.

## 🚀 Features

- **Next.js 15** - Built with the latest Next.js App Router
- **TypeScript** - Fully typed for better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Dark Mode** - Built-in dark mode support
- **Responsive Design** - Mobile-first responsive layout

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Static type checking
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Lucide React](https://lucide.dev/) - Icon library

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/giovanni747/requeue.git
   cd requeue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
requeue/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   │   └── ui/             # shadcn/ui components
│   └── lib/                # Utility functions
├── public/                 # Static assets
├── components.json         # shadcn/ui configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```

## 🎨 Available Components

The following shadcn/ui components are already installed and ready to use:

- `Button` - Customizable button component
- `Card` - Container component with header and content sections
- `Input` - Form input component
- `Label` - Form label component

To add more components:
```bash
npx shadcn@latest add [component-name]
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🎯 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).