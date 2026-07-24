import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion } from 'motion/react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export const DashboardLayout = () => {
  const { user } = useAuth();
  const layoutKey = `${user?.id ?? 'guest'}-${user?.activeContext ?? 'personal'}`;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text flex">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content — offset by sidebar width on desktop only */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60 transition-all duration-300">
        <Header onMobileMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 overflow-y-auto">
          <motion.div
            key={layoutKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};
