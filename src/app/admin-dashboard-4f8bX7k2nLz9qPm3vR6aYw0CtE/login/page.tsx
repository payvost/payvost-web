
import { AdminLoginForm } from '@/components/admin-login-form';
import { Icons } from '@/components/icons';
import Link from 'next/link';

export default function AdminLoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
             <div className="flex justify-center mb-4">
               <Icons.logo className="h-12" />
            </div>
            <h1 className="text-3xl font-bold">Admin Panel Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your credentials to access the management dashboard.
            </p>
          </div>
          <AdminLoginForm />
          <div className="mt-4 text-center text-sm">
            Access is restricted to authorized personnel only.
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        <div className="flex flex-col h-full justify-between p-12 text-white bg-gradient-to-tr from-primary via-emerald-800 to-black">
            <div>
                <h2 className="text-4xl font-bold">Manage the Future of Finance</h2>
                <p className="text-lg mt-4 text-primary-foreground/80">Welcome to the Payvost command center. Monitor transactions, manage users, and ensure operational excellence.</p>
            </div>
            <footer className="text-sm text-primary-foreground/60">
                <p>&copy; 2024 Payvost Inc. All rights reserved.</p>
                <p className="mt-2">NOTICE: This is a secure system. All activities are logged and monitored. Unauthorized access is strictly prohibited and may be subject to legal action.</p>
            </footer>
        </div>
      </div>
    </div>
  )
}
