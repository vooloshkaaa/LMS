import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'uk' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
      title={language === 'en' ? 'Switch to Ukrainian' : 'Switch to English'}
    >
      <Globe className="w-4 h-4" />
      <span className="ml-2 text-sm font-medium">
        {language === 'en' ? 'UK' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageToggle;
