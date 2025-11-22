import { WriterLoginForm } from '@/components/writer-login-form';
import { Icons } from '@/components/icons';
import Link from 'next/link';

export default function WriterLoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-full max-w-[400px] gap-6 px-4">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center mb-4">
              <Icons.logo className="h-12" />
            </div>
            <h1 className="text-3xl font-bold">Writer Portal</h1>
            <p className="text-balance text-muted-foreground">
              Sign in to create and manage content for Payvost.
            </p>
          </div>
          <WriterLoginForm />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Access is restricted to authorized content creators only.
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="flex flex-col h-full justify-between p-12 text-white bg-gradient-to-tr from-primary via-blue-800 to-black">
          <div>
            <h2 className="text-4xl font-bold">Create Amazing Content</h2>
            <p className="text-lg mt-4 text-primary-foreground/80">
              Welcome to the Payvost content management system. Write blog posts, press releases, 
              documentation, and knowledge base articles with ease.
            </p>
          </div>
          <footer className="text-sm text-primary-foreground/60">
            <p>&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
            <p className="mt-2">NOTICE: This is a secure system. All activities are logged and monitored.</p>
          </footer>
        </div>
      </div>
    </div>
  )
}

