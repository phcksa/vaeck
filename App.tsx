
import React, { useState, useEffect } from 'react';
import { dbService } from './services/db';
import { User } from './types';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { TraineeApp } from './components/TraineeApp';
import { WelcomeModal } from './components/WelcomeModal';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true); // Show on initial load

  useEffect(() => {
    // Initialize DB if not exists
    dbService.init();
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowWelcome(true); // Trigger modal on login
  };

  const handleLogout = () => {
    setUser(null);
    setShowWelcome(true); // Trigger modal on logout
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-primary-600">Loading...</div>;
  }

  return (
    <>
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />
      {!user ? (
        <Auth onLogin={handleLogin} />
      ) : user.role === 'admin' ? (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col">
            <div className="max-w-7xl mx-auto w-full mb-4 flex justify-end">
                <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">تسجيل الخروج</button>
            </div>
            <div className="max-w-7xl mx-auto w-full flex-1">
                <AdminDashboard />
            </div>
        </div>
      ) : (
        <TraineeApp initialUser={user} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
