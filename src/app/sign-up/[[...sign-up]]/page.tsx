import { SignUp } from '@clerk/nextjs'
import { Footer } from '@/components/footer'
import { Hexagon, Github, Linkedin } from 'lucide-react'

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/logo.png" 
              alt="Requeue Logo" 
              className="h-12 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-600 mt-2">Join Requeue and start collaborating</p>
          </div>
          
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                card: 'shadow-lg border-0 bg-white',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
                formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                footerActionLink: 'text-blue-600 hover:text-blue-700',
              },
              layout: {
                socialButtonsPlacement: 'bottom',
                socialButtonsVariant: 'blockButton',
              },
            }}
            redirectUrl="/welcome"
          />
        </div>
      </div>

      {/* Footer */}
      <Footer
        logo={<Hexagon className="h-10 w-10" />}
        brandName="Re:queue"
        socialLinks={[
          {
            icon: <Linkedin className="h-5 w-5" />,
            href: "https://www.linkedin.com/in/giovanni-san/",
            label: "LinkedIn",
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
          text: "© 2024 Requeue",
          license: "All rights reserved",
        }}
      />
    </div>
  )
}
