import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-surface-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ICU Risk <span className="text-primary-300">Intelligence</span>
          </h1>
          <p className="text-primary-200/60 text-sm mt-1">Clinical Decision Support System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
