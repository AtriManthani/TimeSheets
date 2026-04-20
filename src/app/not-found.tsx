import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">404</h2>
        <p className="text-gray-500">Page not found.</p>
        <Link href="/dashboard" className="text-primary-600 hover:underline text-sm">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
