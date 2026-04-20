export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-lg">
            TF
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Timeflux</h1>
          <p className="text-sm text-gray-500">Division of Information Technology & Services</p>
        </div>
        {children}
      </div>
    </div>
  );
}
