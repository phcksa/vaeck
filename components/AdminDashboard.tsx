// src/components/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { User, AccessCode } from '../types';
import { Download, Plus } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Footer } from './ui/Footer';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'codes'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Form states
  const [codePrefix, setCodePrefix] = useState('MOH');
  const [codeDays, setCodeDays] = useState(30);
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);

  // جلب البيانات من فايربيس عند فتح الصفحة
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const u = await dbService.getAllUsers();
            const c = await dbService.getAllCodes();
            setUsers(u);
            setCodes(c);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [refreshTrigger]);

  const activeUsersCount = users.filter(u => new Date(u.expiryDate) > new Date()).length;
  const activeCodesCount = codes.filter(c => c.status === 'active').length;

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = await dbService.generateCode(codePrefix, codeDays);
    setLastGeneratedCode(newCode);
    setRefreshTrigger(prev => prev + 1); // إعادة تحميل القائمة
  };

  const downloadCSV = () => {
    const headers = ["Username", "Name", "Department", "Score", "Expiry Date", "Status"];
    const rows = users.map(u => {
        const isExpired = new Date(u.expiryDate) <= new Date();
        return [
            u.username, u.name, u.dept, u.score,
            u.expiryDate.split('T')[0], isExpired ? "منتهي" : "نشط"
        ].join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-600 font-bold">جاري الاتصال بقاعدة البيانات...</div>;

  return (
    <div className="space-y-8 animate-fade-in flex flex-col min-h-full">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">☁️ VTS - لوحة التحكم (Online)</h1>
          <p className="text-gray-500">متصل بقاعدة بيانات Firebase</p>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary-600 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-1">{users.length}</div>
          <div className="text-gray-600 text-sm">المتدربين المسجلين</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary-600 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-1">{activeUsersCount}</div>
          <div className="text-gray-600 text-sm">اشتراكات سارية</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-b-4 border-primary-600 text-center">
          <div className="text-3xl font-bold text-primary-600 mb-1">{activeCodesCount}</div>
          <div className="text-gray-600 text-sm">أكواد متاحة</div>
        </div>
      </div>

      {/* التبويبات */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex-1">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button onClick={() => setActiveTab('users')} className={`py-4 px-8 font-medium text-sm transition-colors border-b-2 ${activeTab === 'users' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>👥 المتدربين</button>
            <button onClick={() => setActiveTab('codes')} className={`py-4 px-8 font-medium text-sm transition-colors border-b-2 ${activeTab === 'codes' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>🔑 الأكواد</button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'users' ? (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                     <h3 className="text-lg font-bold">سجل المستخدمين</h3>
                    <Button onClick={downloadCSV} variant="outline" className="flex items-center gap-2"><Download size={16} /> تحميل التقرير</Button>
                </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المستخدم</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الاسم</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">القسم</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">النقاط</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => {
                      const daysLeft = Math.ceil((new Date(user.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      const isExpired = daysLeft <= 0;
                      return (
                        <tr key={user.username}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dept}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{user.score}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-bold ${isExpired ? 'text-red-700' : 'text-green-700'}`}>
                              {isExpired ? 'منتهي ❌' : `نشط ✅`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20} className="text-primary-600"/> إصدار كود</h3>
                <form onSubmit={handleGenerateCode} className="space-y-4">
                  <Input label="بادئة" value={codePrefix} onChange={(e) => setCodePrefix(e.target.value)} placeholder="MOH"/>
                  <Input label="المدة (أيام)" type="number" value={codeDays} onChange={(e) => setCodeDays(parseInt(e.target.value))} min={1}/>
                  <Button type="submit" fullWidth>توليد وحفظ</Button>
                </form>
                {lastGeneratedCode && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 text-sm mb-1">تم الحفظ</p>
                    <p className="text-2xl font-mono font-bold text-green-700 tracking-wider break-all">{lastGeneratedCode}</p>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <h3 className="text-lg font-bold mb-4">الأرشيف</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الكود</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المدة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">استخدم بواسطة</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {codes.map((c) => (
                        <tr key={c.code}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-700">{c.code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.days}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{c.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.usedBy || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};
