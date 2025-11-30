
import React, { useState } from 'react';
import { dbService } from '../services/db';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Footer } from './ui/Footer';
import { User } from '../types';
import { Activity } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regEmpId, setRegEmpId] = useState('');
  const [regDept, setRegDept] = useState('ICU');
  const [regMsg, setRegMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await dbService.login(loginUser, loginPass);
    if (res.success && res.user) {
      onLogin(res.user);
    } else {
      setLoginError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMsg(null);
    
    if (!regName || !regUser || !regPass || !regEmpId) {
        setRegMsg({type: 'error', text: 'جميع الحقول مطلوبة'});
        return;
    }

    const newUser: User = {
        username: regUser,
        name: regName,
        empId: regEmpId,
        dept: regDept,
        role: 'user',
        score: 0,
        expiryDate: '', // Handled by service
        createdAt: ''
    };

    const res = await dbService.register(newUser, regPass);
    if (res.success) {
        setRegMsg({type: 'success', text: res.message});
        setTimeout(() => setMode('login'), 2000);
    } else {
        setRegMsg({type: 'error', text: res.message});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <div className="mb-8 text-center">
            <div className="bg-primary-600 p-4 rounded-full inline-block mb-4 shadow-lg">
                <Activity className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">VTS Portal</h1>
            <p className="text-gray-500">VAE Training System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl w-full overflow-hidden">
            <div className="flex border-b">
                <button 
                    onClick={() => setMode('login')} 
                    className={`flex-1 py-4 font-medium transition-colors ${mode === 'login' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    تسجيل الدخول
                </button>
                <button 
                    onClick={() => setMode('register')} 
                    className={`flex-1 py-4 font-medium transition-colors ${mode === 'register' ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    إنشاء حساب جديد
                </button>
            </div>

            <div className="p-8">
                {mode === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input 
                            label="اسم المستخدم" 
                            value={loginUser} 
                            onChange={(e) => setLoginUser(e.target.value)}
                            placeholder="أدخل اسم المستخدم"
                        />
                        <Input 
                            label="كلمة المرور" 
                            type="password"
                            value={loginPass} 
                            onChange={(e) => setLoginPass(e.target.value)}
                            placeholder="••••••••"
                            error={loginError}
                        />
                        <Button type="submit" fullWidth className="py-3 text-lg mt-6">دخول</Button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <Input 
                            label="الاسم الكامل" 
                            value={regName} 
                            onChange={(e) => setRegName(e.target.value)}
                        />
                        <Input 
                            label="اسم المستخدم" 
                            value={regUser} 
                            onChange={(e) => setRegUser(e.target.value)}
                        />
                        <Input 
                            label="كلمة المرور" 
                            type="password"
                            value={regPass} 
                            onChange={(e) => setRegPass(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="الرقم الوظيفي" 
                                value={regEmpId} 
                                onChange={(e) => setRegEmpId(e.target.value)}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
                                <select 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={regDept}
                                    onChange={(e) => setRegDept(e.target.value)}
                                >
                                    <option value="ICU">ICU</option>
                                    <option value="ER">ER</option>
                                    <option value="OR">OR</option>
                                    <option value="Ward">General Ward</option>
                                </select>
                            </div>
                        </div>
                        
                        {regMsg && (
                            <div className={`p-3 rounded text-sm ${regMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {regMsg.text}
                            </div>
                        )}

                        <Button type="submit" fullWidth className="mt-4">تسجيل</Button>
                    </form>
                )}
            </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};
