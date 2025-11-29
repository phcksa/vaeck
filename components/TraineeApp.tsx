import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { dbService } from '../services/db';
import { VAESimulator } from './VAESimulator';
import { LogOut, Medal } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface TraineeAppProps {
  initialUser: User;
  onLogout: () => void;
}

export const TraineeApp: React.FC<TraineeAppProps> = ({ initialUser, onLogout }) => {
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState('');
  const [isActivated, setIsActivated] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  const checkStatus = (user: User) => {
    const now = new Date();
    const expiry = new Date(user.expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    setDaysLeft(diffDays);
    setIsActivated(diffDays > 0);
  };

  useEffect(() => {
    checkStatus(currentUser);
  }, [currentUser]);

  const handleRefreshUser = () => {
    const db = dbService.getDb();
    if (db.users[currentUser.username]) {
        setCurrentUser(db.users[currentUser.username]);
    }
  };

  const handleActivate = () => {
    setActivationError('');
    if (!activationCode) return;

    const result = dbService.activateCode(currentUser.username, activationCode);
    if (result.success) {
      const db = dbService.getDb();
      setCurrentUser(db.users[currentUser.username]);
      // The useEffect will trigger status update
    } else {
      setActivationError('الكود غير صحيح أو مستخدم.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-l border-gray-200 p-6 flex flex-col shadow-lg z-10">
        <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-primary-700">VAE Portal</h1>
            <p className="text-xs text-gray-500 mt-1">Cloud Training System</p>
        </div>

        <div className="mb-6 p-4 rounded-xl border border-primary-100 bg-primary-50">
            <div className="text-center">
                <div className="font-bold text-gray-800 text-lg mb-1">👤 {currentUser.name}</div>
                <div className="text-sm text-gray-500">{currentUser.dept}</div>
            </div>
        </div>

        <div className="space-y-4 flex-1">
            <div className={`p-4 rounded-lg border text-center ${isActivated ? 'bg-green-50 border-green-600' : 'bg-red-50 border-red-600'}`}>
                <div className={`font-bold mb-1 ${isActivated ? 'text-green-800' : 'text-red-800'}`}>
                    {isActivated ? '✅ ساري' : '❌ منتهي'}
                </div>
                {isActivated && (
                    <div className="text-sm text-green-700 font-bold">باقي {daysLeft} يوم</div>
                )}
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                <div className="text-gray-500 text-sm mb-1">نقاطك التراكمية</div>
                <div className="text-3xl font-bold text-primary-600">{currentUser.score}</div>
            </div>
        </div>

        <button 
            onClick={onLogout}
            className="mt-8 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors p-2 rounded-lg"
        >
            <LogOut size={18} />
            <span>خروج</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {!isActivated ? (
            <div className="max-w-lg mx-auto mt-20 text-center animate-fade-in">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-8 border-red-600">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        عذراً {currentUser.name}، اشتراكك غير مفعل.
                    </h2>
                    
                    <div className="space-y-4">
                        <Input 
                            placeholder="كود التفعيل" 
                            value={activationCode}
                            onChange={(e) => setActivationCode(e.target.value)}
                            className="text-center text-lg font-mono uppercase"
                            error={activationError}
                        />
                        <Button onClick={handleActivate} fullWidth className="py-3 text-lg bg-primary-600 hover:bg-primary-700">
                            تفعيل الاشتراك 🔓
                        </Button>
                        <button onClick={onLogout} className="text-gray-500 hover:text-gray-700 text-sm underline mt-4">
                            تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="max-w-6xl mx-auto animate-fade-in">
                <div className="flex items-center gap-2 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">🩺 VAE Simulator (Connected)</h1>
                </div>
                <VAESimulator user={currentUser} onUpdateUser={handleRefreshUser} />
            </div>
        )}
      </main>
    </div>
  );
};