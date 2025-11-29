import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { User, ScenarioData, Diagnosis } from '../types';
import { Button } from './ui/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle2, XCircle, AlertTriangle, Activity } from 'lucide-react';

interface VAESimulatorProps {
    user: User;
    onUpdateUser: () => void;
}

const NHSN_ANTIBIOTICS = ["Amikacin", "Cefepime", "Meropenem", "Vancomycin", "Piperacillin/Tazobactam", "Levofloxacin", "Linezolid"];

const generateScenario = () => {
    // Generate 7 days of data
    const data: ScenarioData[] = [];
    const basePeep = 5;
    const baseTemp = 37.0;
    const baseWbc = 8.0;

    // Randomly decide outcome
    const outcomes: Diagnosis[] = ["No VAE", "VAC", "IVAC"];
    const actualDx = outcomes[Math.floor(Math.random() * outcomes.length)];

    for (let i = 1; i <= 7; i++) {
        let peep = basePeep;
        let temp = baseTemp;
        let wbc = baseWbc;
        let fio2 = 40;
        let secretion = "Clear";

        // Simulate Baseline stability for days 1-4
        if (i <= 4) {
             peep = basePeep + Math.floor(Math.random() * 2); 
             fio2 = 40 + Math.floor(Math.random() * 10);
        } else {
            // Deterioration phase based on Dx
            if (actualDx !== "No VAE") {
                peep = basePeep + 3 + Math.floor(Math.random() * 3); // Increase PEEP > 3 over baseline
                fio2 = fio2 + 20;
            }
            if (actualDx === "IVAC") {
                temp = 38.5 + (Math.random() * 1.5);
                wbc = 14.0 + (Math.random() * 5);
                secretion = "Purulent";
            }
        }

        data.push({
            day: i,
            peep,
            temp: parseFloat(temp.toFixed(1)),
            wbc: parseFloat(wbc.toFixed(1)),
            fio2,
            secretion
        });
    }

    return { data, actualDx };
};

export const VAESimulator: React.FC<VAESimulatorProps> = ({ user, onUpdateUser }) => {
    const [scenario, setScenario] = useState<{data: ScenarioData[], actualDx: Diagnosis} | null>(null);
    const [selectedDx, setSelectedDx] = useState<Diagnosis | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [feedback, setFeedback] = useState<{correct: boolean, msg: string} | null>(null);

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
        
        const isCorrect = selectedDx === scenario.actualDx;
        setIsAnswered(true);

        if (isCorrect) {
            dbService.updateScore(user.username, 1);
            setFeedback({ correct: true, msg: "إجابة صحيحة! أحسنت. (+1 نقطة)" });
            onUpdateUser(); // Refresh score in sidebar
        } else {
            setFeedback({ correct: false, msg: `إجابة خاطئة. التشخيص الصحيح هو ${scenario.actualDx}` });
        }
    };

    if (!scenario) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                        <AlertTriangle className="text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">حالة سريرية رقم #{Math.floor(Math.random() * 1000)}</h2>
                        <p className="text-gray-600 mt-1">
                            مريض في وحدة العناية المركزة، على جهاز التنفس الصناعي لمدة 7 أيام.
                            الرجاء مراجعة البيانات الحيوية وتحديد ما إذا كان المريض يعاني من حدث مرتبط بجهاز التنفس (VAE).
                        </p>
                        <div className="mt-2 text-sm text-gray-500 flex gap-2">
                             <span className="bg-gray-100 px-2 py-1 rounded">Antibiotics: {NHSN_ANTIBIOTICS[Math.floor(Math.random() * NHSN_ANTIBIOTICS.length)]}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Charts */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Activity size={18} />
                        تغيرات PEEP & FiO2
                    </h3>
                    <div className="h-64 ltr" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={scenario.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
                                <YAxis yAxisId="left" label={{ value: 'PEEP', angle: -90, position: 'insideLeft' }} />
                                <YAxis yAxisId="right" orientation="right" label={{ value: 'FiO2', angle: 90, position: 'insideRight' }} />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="peep" stroke="#0d9488" strokeWidth={2} name="PEEP" />
                                <Line yAxisId="right" type="monotone" dataKey="fio2" stroke="#f59e0b" name="FiO2 %" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Activity size={18} />
                        الحرارة وكريات الدم البيضاء (Temp & WBC)
                    </h3>
                    <div className="h-64 ltr" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={scenario.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" label={{ value: 'Day', position: 'insideBottom', offset: -5 }} />
                                <YAxis yAxisId="left" domain={[36, 40]} />
                                <YAxis yAxisId="right" orientation="right" />
                                <Tooltip />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#ef4444" name="Temp (°C)" />
                                <Line yAxisId="right" type="monotone" dataKey="wbc" stroke="#6366f1" name="WBC" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Daily Data Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-700">البيانات اليومية</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2">اليوم</th>
                                <th className="px-4 py-2">Min PEEP</th>
                                <th className="px-4 py-2">Min FiO2</th>
                                <th className="px-4 py-2">Max Temp</th>
                                <th className="px-4 py-2">Max WBC</th>
                                <th className="px-4 py-2">Secretion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scenario.data.map((d) => (
                                <tr key={d.day} className="hover:bg-gray-50 text-center">
                                    <td className="px-4 py-2 font-bold">{d.day}</td>
                                    <td className="px-4 py-2">{d.peep}</td>
                                    <td className="px-4 py-2">{d.fio2}</td>
                                    <td className={`px-4 py-2 ${d.temp > 38 ? 'text-red-600 font-bold' : ''}`}>{d.temp}</td>
                                    <td className={`px-4 py-2 ${d.wbc > 12 ? 'text-red-600 font-bold' : ''}`}>{d.wbc}</td>
                                    <td className="px-4 py-2">{d.secretion}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Decision Area */}
            <div className="bg-primary-50 p-6 rounded-xl border border-primary-200">
                <h3 className="text-lg font-bold text-primary-900 mb-4">ما هو تشخيصك؟</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {(["No VAE", "VAC", "IVAC", "PVAP"] as Diagnosis[]).map((dx) => (
                        <button
                            key={dx}
                            onClick={() => !isAnswered && setSelectedDx(dx)}
                            disabled={isAnswered}
                            className={`p-4 rounded-lg border-2 font-bold transition-all ${
                                selectedDx === dx 
                                    ? 'border-primary-600 bg-primary-600 text-white shadow-lg scale-105' 
                                    : 'border-white bg-white text-gray-600 hover:border-primary-300'
                            } ${isAnswered ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            {dx}
                        </button>
                    ))}
                </div>

                {!isAnswered ? (
                    <Button 
                        onClick={handleSubmit} 
                        disabled={!selectedDx} 
                        className="w-full md:w-auto text-lg px-8"
                    >
                        تحقق من الإجابة
                    </Button>
                ) : (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${feedback?.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {feedback?.correct ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                            <span className="font-bold text-lg">{feedback?.msg}</span>
                        </div>
                        <Button onClick={loadNewCase} variant="secondary" className="w-full md:w-auto">
                            الحالة التالية ➡️
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
