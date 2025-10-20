import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Requeue Logo" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
              card: 'shadow-lg border-0',
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
  )
}
