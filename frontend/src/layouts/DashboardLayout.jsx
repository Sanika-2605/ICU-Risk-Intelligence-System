import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getAlerts } from '../services/alertService';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    getAlerts()
      .then((data) => {
        const alerts = data?.data?.alerts || data?.alerts || data || [];
        setAlertCount(Array.isArray(alerts) ? alerts.length : 0);
      })
      .catch(() => setAlertCount(0));
  }, []);

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Header */}
        <Header
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
          alertCount={alertCount}
        />

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
