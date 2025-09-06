import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Hexagon, Github, Linkedin } from "lucide-react"
import { Footer } from "@/components/footer";
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
      <html lang="en" className="dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
        >
          {children}
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
        </body>
      </html>
    </ClerkProvider>
  );
}
