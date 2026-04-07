export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 60%, #ecfdf5 100%)" }}
    >
      {/* Background food decorations */}
      <div className="absolute top-10 left-10 text-6xl opacity-10 rotate-12 select-none">🍕</div>
      <div className="absolute top-16 right-12 text-5xl opacity-10 -rotate-12 select-none">🍎</div>
      <div className="absolute bottom-10 left-20 text-5xl opacity-10 rotate-6 select-none">🥗</div>
      <div className="absolute bottom-16 right-16 text-4xl opacity-10 -rotate-6 select-none">🧃</div>
      <div className="absolute top-1/3 left-6 text-4xl opacity-10 select-none">⭐</div>
      <div className="absolute top-2/3 right-6 text-3xl opacity-10 select-none">⭐</div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-3xl text-5xl mb-4 shadow-lg">
            🍱
          </div>
          <h1 className="text-3xl font-black text-gray-900">LunchBox</h1>
          <p className="text-gray-500 font-medium mt-1">Healthy lunches, happy kids</p>
        </div>
        {children}
      </div>
    </div>
  );
}
