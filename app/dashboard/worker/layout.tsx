'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WorkerLayoutProps {
  children: React.ReactNode;
}

export default function WorkerLayout({ children }: WorkerLayoutProps) {
  const router = useRouter();
  const [worker, setWorker] = useState<any>(null);

  useEffect(() => {
    // Get worker info from session/API
    fetchWorkerInfo();
  }, []);

  const fetchWorkerInfo = async () => {
    try {
      // For now, we'll use mock data
      setWorker({ name: 'Worker', email: 'worker@example.com' });
    } catch (error) {
      console.error('Error fetching worker info:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/dashboard/select');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API fails
      router.push('/dashboard/select');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Worker Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {worker?.name || 'Worker'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}