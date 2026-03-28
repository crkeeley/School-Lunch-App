export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🍎</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">School Lunch Ordering</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
