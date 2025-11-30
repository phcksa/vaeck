
import React from 'react';
import { X, Linkedin, Code } from 'lucide-react';
import { Button } from './ui/Button';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 relative">
        
        {/* Decorative Header */}
        <div className="bg-primary-600 h-24 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-primary-600 to-primary-600"></div>
            <div className="bg-white p-3 rounded-full shadow-lg z-10">
                <Code className="text-primary-600 w-8 h-8" />
            </div>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            >
                <X size={24} />
            </button>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">مرحباً بك في VTS</h2>
          <p className="text-primary-600 font-medium text-sm mb-6 uppercase tracking-wider">VAE Training System</p>
          
          <div className="space-y-4 text-gray-600 leading-relaxed mb-8">
            <p>
              تم برمجة هذا الموقع بواسطة 
              <span className="font-bold text-gray-900 mx-1">محمد القرني</span>
            </p>
            <p>
              وهو موقع متخصص للتدريب على مراقبة الأحداث المرتبطة بجهاز التنفس الصناعي (VAE).
            </p>
            <p className="text-sm">
              في حال عندك أي استفسار يسعدني تواصلك معي على LinkedIn
            </p>
          </div>

          <a 
            href="https://www.linkedin.com/in/muhmedqrni" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#0077b5] hover:bg-[#006396] text-white py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg mb-4 group"
          >
            <Linkedin size={20} className="group-hover:scale-110 transition-transform"/>
            <span className="font-bold dir-ltr">www.linkedin.com/in/muhmedqrni</span>
          </a>

          <Button 
            variant="secondary" 
            fullWidth 
            onClick={onClose}
            className="border-gray-200"
          >
            الدخول للموقع
          </Button>
        </div>
      </div>
    </div>
  );
};
