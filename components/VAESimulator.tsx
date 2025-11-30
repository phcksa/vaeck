import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { User, Diagnosis } from '../types';
import { generateScenario, Scenario } from '../services/scenarioGenerator';
import { Button } from './ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, XCircle, AlertTriangle, Activity, Beaker, FlaskConical } from 'lucide-react';

interface VAESimulatorProps {
    user: User;
    onUpdateUser: () => void;
}

export const VAESimulator: React.FC<VAESimulatorProps> = ({ user, onUpdateUser }) => {
    const [scenario, setScenario] = useState<Scenario | null>(null);
    const [selectedDx, setSelectedDx] = useState<Diagnosis | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [feedback, setFeedback] = useState<{correct: boolean, msg: string, detail: string} | null>(null);

    useEffect(() => {
        loadNewCase();
    }, []);

    const loadNewCase = () => {
        setScenario(generateScenario());
        setSelectedDx(null);
        setIsAnswered(false);
        setFeedback(null);
    };

    const handleSubmit = () => {
        if (!selectedDx || !scenario) return;
        
        const isCorrect = selectedDx === scenario.diagnosis;
        setIsAnswered(true);

        if (isCorrect) {
            dbService.updateScore(user.username, 1);
            setFeedback({ 
                correct: true, 
                msg: "إجابة صحيحة! أحسنت. (+1 نقطة)",
                detail: scenario.reason
            });
            onUpdateUser(); // Refresh score in sidebar
        } else {
            setFeedback({ 
                correct: false, 
                msg: `إجابة خاطئة. التشخيص الصحيح هو ${scenario.diagnosis}`,
                detail: scenario.reason
            });
        }
    };

    if (!scenario) return <div className="p-8 text-center text-gray-500">جاري تحميل الحالة...</div>;

    // Prepare data for Chart 1 (Convert FiO2 0.30 to 30 for easier visualization)
    const chartData = scenario.data.map(d => ({
        ...d,
        fio2Display: Math.round(d.minFio2 * 100)
    }));

    return (
        <div className="space-y-6">
            {/* Case Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                    <div className="bg-primary-50 p-3 rounded-full">
                        <Activity className="text-primary-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <h2 className="text-xl font-bold text-gray-900">حالة سريرية #{scenario.id}</h2>
                             <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">Day 1 to 10</span>
                        </div>
                        <p className="text-gray-600 mt-2 leading-relaxed">
                            مريض بالغ في وحدة العناية المركزة (ICU)، على جهاز التنفس الصناعي منذ 10 أيام.
                            الرجاء تحليل بيانات جهاز التنفس (Ventilator Settings)، العلامات الحيوية، ونتائج المختبر أدناه لتحديد ما إذا كان المريض يحقق معايير VAE.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Respiratory */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-teal-600"/>
                        Respiratory Data (Daily Min)
                    </h3>
                    <div className="h-64 ltr" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
                                <YAxis yAxisId="left" label={{ value: 'PEEP (cmH2O)', angle: -90, position: 'insideLeft', offset: 10 }} domain={[0, 20]} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'FiO2 (%)', angle: 90, position: 'insideRight', offset: 10 }} domain={[20, 100]} />
                                <Tooltip 
                                    formatter={(value: number, name: string) => [
                                        name === 'FiO2 %' ? `${value}%` : value, 
                                        name
                                    ]}
                                    labelFormatter={(day) => `Day ${day}`}
                                />
                                <Legend />
                                <Line yAxisId="left" type="stepAfter" dataKey="minPeep" stroke="#008080" strokeWidth={3} name="Min PEEP" dot={false} />
                                <Line yAxisId="right" type="stepAfter" dataKey="fio2Display" stroke="#f59e0b" strokeWidth={2} name="FiO2 %" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-center text-gray-400 mt-2">Charts show daily minimum values as per NHSN algorithm</p>
                </div>

                {/* Chart 2: Signs of Infection */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-red-500"/>
                        Infection Signs (Temp & WBC)
                    </h3>
                    <div className="h-64 ltr" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
                                <YAxis yAxisId="left" domain={[36, 40]} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft' }}/>
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'WBC', angle: 90, position: 'insideRight' }} />
                                <Tooltip labelFormatter={(day) => `Day ${day}`} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="tempMax" stroke="#ef4444" strokeWidth={2} name="Max Temp" dot={{r: 2}} />
                                <Line yAxisId="right" type="monotone" dataKey="wbc" stroke="#6366f1" strokeWidth={2} name="WBC Count" dot={{r: 2}} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Data Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h3 className="font-bold text-gray-700">سجل البيانات اليومي</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2">Day</th>
                                    <th className="px-3 py-2 text-teal-800">Min PEEP</th>
                                    <th className="px-3 py-2 text-amber-700">Min FiO2</th>
                                    <th className="px-3 py-2 text-red-700">Max Temp</th>
                                    <th className="px-3 py-2 text-indigo-700">Max WBC</th>
                                    <th className="px-3 py-2">Antibiotic</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {scenario.data.map((d) => (
                                    <tr key={d.day} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-bold text-gray-500">{d.day}</td>
                                        <td className="px-3 py-2 font-medium">{d.minPeep}</td>
                                        <td className="px-3 py-2 font-medium">{Math.round(d.minFio2 * 100)}%</td>
                                        <td className={`px-3 py-2 ${d.tempMax > 38 ? 'text-red-600 font-bold' : ''}`}>{d.tempMax}</td>
                                        <td className={`px-3 py-2 ${d.wbc > 12000 ? 'text-indigo-600 font-bold' : ''}`}>{d.wbc}</td>
                                        <td className="px-3 py-2 text-xs">
                                            {d.antibiotic ? (
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{d.antibiotic}</span>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Lab Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
                     <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                        <FlaskConical size={20} className="text-purple-600" />
                        <h3 className="font-bold text-gray-700">Microbiology Report</h3>
                    </div>
                    <div className="p-6 flex-1 text-sm space-y-4">
                        <div>
                            <span className="block text-gray-500 text-xs mb-1">Specimen Type</span>
                            <div className="font-medium text-gray-900">{scenario.lab.specimenType}</div>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-xs mb-1">Collection Date</span>
                            <div className="font-medium text-gray-900">Day {scenario.lab.collectionDate}</div>
                        </div>
                        <div className="pt-2 border-t border-dashed">
                             <span className="block text-gray-500 text-xs mb-1">Culture Result</span>
                             <div className={`font-bold ${scenario.lab.cultureResult.includes("Positive") ? "text-red-600" : "text-gray-700"}`}>
                                {scenario.lab.cultureResult}
                             </div>
                             {scenario.lab.quantification && (
                                 <div className="text-xs text-gray-600 mt-1 bg-gray-100 p-1 rounded inline-block">
                                     {scenario.lab.quantification}
                                 </div>
                             )}
                        </div>
                        <div className="pt-2 border-t border-dashed">
                            <span className="block text-gray-500 text-xs mb-1">Gram Stain / Purulence</span>
                            <div className="text-gray-700 italic">
                                "{scenario.lab.gramStain}"
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Decision Area */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Beaker className="text-primary-600"/>
                    القرار الطبي (Diagnosis)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {(["No VAE", "VAC", "IVAC", "PVAP"] as Diagnosis[]).map((dx) => (
                        <button
                            key={dx}
                            onClick={() => !isAnswered && setSelectedDx(dx)}
                            disabled={isAnswered}
                            className={`p-4 rounded-lg border-2 font-bold transition-all shadow-sm ${
                                selectedDx === dx 
                                    ? 'border-primary-600 bg-primary-600 text-white shadow-md transform scale-105' 
                                    : 'border-white bg-white text-gray-600 hover:border-primary-300 hover:bg-primary-50'
                            } ${isAnswered ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {dx}
                        </button>
                    ))}
                </div>

                {!isAnswered ? (
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleSubmit} 
                            disabled={!selectedDx} 
                            className="w-full md:w-auto text-lg px-8 py-3"
                        >
                            تأكيد الإجابة
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div className={`p-5 rounded-xl border flex items-start gap-4 ${feedback?.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            {feedback?.correct ? <CheckCircle2 className="text-green-600 shrink-0 mt-1" size={28} /> : <XCircle className="text-red-600 shrink-0 mt-1" size={28} />}
                            <div>
                                <h4 className={`text-lg font-bold mb-1 ${feedback?.correct ? 'text-green-800' : 'text-red-800'}`}>
                                    {feedback?.msg}
                                </h4>
                                <p className={`text-sm leading-relaxed ${feedback?.correct ? 'text-green-700' : 'text-red-700'}`}>
                                    {feedback?.detail}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={loadNewCase} variant="secondary" className="w-full md:w-auto shadow-sm">
                                الحالة التالية ➡️
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};