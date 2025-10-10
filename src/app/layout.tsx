import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Hexagon, Github, Linkedin } from "lucide-react"
import { Footer } from "@/components/footer";
import { AppSidebar } from "@/components/app-sidebar";
import { UserSync } from "@/components/user-sync";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/contexts/SocketContext";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Requeue - Dark Modern Next.js App",
  description: "A modern Next.js application with shadcn/ui components, built for the dark.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://api.clerk.com" />
          <link rel="dns-prefetch" href="https://api.clerk.com" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const theme = localStorage.getItem('theme');
                    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                    
                    // Only change if user has explicitly set a different theme
                    if (theme === 'light') {
                      document.documentElement.classList.remove('dark');
                    } else if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    }
                    // If no theme preference, keep the default dark mode
                  } catch (e) {
                    // Keep default dark mode on error
                    document.documentElement.classList.add('dark');
                  }
                })();
              `,
            }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        >
          <SignedIn>
            <SocketProvider>
              <UserSync />
              <AppSidebar />
              {/* Leave space for rounded glass sidebar (width 4rem + 1rem gap) */}
              <main className="min-h-screen ml-20 pl-4 pr-4">
                {children}
              </main>
            </SocketProvider>
          </SignedIn>
          
          <SignedOut>
            <div className="min-h-screen">
              {children}
            </div>
            <Footer
              logo={<Hexagon className="h-10 w-10" />}
              brandName="Re:queue"
              socialLinks={[
                {
                  icon: <Linkedin className="h-5 w-5" />,
                  href: "https://www.linkedin.com/in/giovanni-san/",
                  label: "Instagram",
                },
                {
                  icon: <Github className="h-5 w-5" />,
                  href: "https://github.com/giovanni747",
                  label: "GitHub",
                },
              ]}
              mainLinks={[
                { href: "/products", label: "Products" },
                { href: "/about", label: "About" },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
              ]}
              legalLinks={[
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ]}
              copyright={{
                text: "© 2024 Awesome Corp",
                license: "All rights reserved",
              }}
            />
          </SignedOut>
          <Toaster 
            position="top-center" 
            toastOptions={{
              duration: 3000,
              style: {
                background: "#1f2937",
                color: "#f9fafb",
                border: "1px solid #374151",
              },
              success: {
                style: {
                  background: "#1f2937",
                  color: "#f9fafb",
                  border: "1px solid #374151",
                },
              },
              error: {
                style: {
                  background: "#dc2626",
                  color: "#f9fafb",
                  border: "1px solid #b91c1c",
                },
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
