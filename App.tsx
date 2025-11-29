import React, { useState, useEffect } from 'react';
import { dbService } from './services/db';
import { User } from './types';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { TraineeApp } from './components/TraineeApp';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize DB if not exists
    dbService.init();
    
    // Check session storage (optional, for refresh persistence within session)
    // For this demo, we'll start at login or restore from a simple state if we implemented persisted session
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-primary-600">Loading...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (user.role === 'admin') {
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto mb-4 flex justify-end">
                <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">تسجيل الخروج</button>
            </div>
            <div className="max-w-7xl mx-auto">
                <AdminDashboard />
            </div>
        </div>
    );
  }

  return <TraineeApp initialUser={user} onLogout={handleLogout} />;
}

export default App;
