
import React from 'react';
import { Code } from 'lucide-react';

interface FooterProps {
    className?: string;
    variant?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ className = '', variant = 'light' }) => {
    const textColor = variant === 'dark' ? 'text-white/80' : 'text-gray-500';
    
    return (
        <div className={`mt-auto py-6 text-center text-xs ${textColor} ${className}`}>
            <div className="flex items-center justify-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                <Code size={12} />
                <span>تمت البرمجة بواسطة</span>
                <span className="font-bold">محمد القرني</span>
            </div>
        </div>
    );
};
