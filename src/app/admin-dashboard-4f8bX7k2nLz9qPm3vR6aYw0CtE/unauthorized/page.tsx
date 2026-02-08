import Link from 'next/link';

export const metadata = {
  title: 'Unauthorized - Payvost Admin',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm1.28 6.22a.75.75 0 0 0-1.06-1.06L12 7.94l-.22-.53a.75.75 0 1 0-1.38.56l.53 1.28-.53 1.28a.75.75 0 1 0 1.38.56l.22-.53.22.53a.75.75 0 0 0 1.38-.56l-.53-1.28.53-1.28Z" clipRule="evenodd" />
            <path d="M10.5 15.75a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-muted-foreground">You do not have permission to access the admin dashboard. If you believe this is a mistake, contact an administrator.</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/admin-dashboard-4f8bX7k2nLz9qPm3vR6aYw0CtE/login" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-white text-sm font-medium hover:opacity-90">Go to admin login</Link>
          <Link href="/" className="inline-flex items-center rounded-md border px-4 py-2 text-sm">Return home</Link>
        </div>
      </div>
    </div>
  );
}
