import React, { useState, useRef, useEffect } from 'react';
import { PaintBrushIcon } from './icons';
import { Theme } from '../types';

interface ThemeSelectorProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themeOptions: { id: Theme; name: string; colors: string[] }[] = [
  { id: 'default', name: 'Default', colors: ['bg-indigo-500', 'bg-gray-700'] },
  { id: 'classic', name: 'Classic', colors: ['bg-[#002855]', 'bg-[#D4AF37]'] },
  { id: 'slate', name: 'Slate', colors: ['bg-slate-700', 'bg-teal-400'] },
  { id: 'graphite', name: 'Graphite', colors: ['bg-gray-800', 'bg-sky-400'] },
  { id: 'crimson', name: 'Crimson', colors: ['bg-red-900', 'bg-red-500'] },
  { id: 'emerald', name: 'Emerald', colors: ['bg-emerald-800', 'bg-yellow-600'] },
  { id: 'ocean', name: 'Ocean', colors: ['bg-blue-800', 'bg-blue-500'] },
  { id: 'sunrise', name: 'Sunrise', colors: ['bg-orange-900', 'bg-orange-500'] },
  { id: 'paper', name: 'Paper', colors: ['bg-[#a69888]', 'bg-[#5f544b]'] },
  { id: 'forest', name: 'Forest', colors: ['bg-lime-800', 'bg-lime-500'] },
  { id: 'royal', name: 'Royal', colors: ['bg-purple-800', 'bg-purple-500'] },
  { id: 'industrial', name: 'Industrial', colors: ['bg-gray-700', 'bg-amber-500'] },
  { id: 'quantum', name: 'Quantum', colors: ['bg-slate-900', 'bg-cyan-400'] },
];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (theme: Theme) => {
    onThemeChange(theme);
    setIsOpen(false);
  };

  const currentThemeName = themeOptions.find(t => t.id === currentTheme)?.name || 'Default';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <PaintBrushIcon className="w-5 h-5" />
        Theme: {currentThemeName}
        <svg className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 right-0">
          <ul className="py-1">
            {themeOptions.map((theme) => (
              <li key={theme.id}>
                <button
                  onClick={() => handleSelect(theme.id)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                >
                  <div className="flex items-center">
                    {theme.colors.map((color, i) => (
                      <span key={i} className={`w-4 h-4 rounded-full ${color} ${i > 0 ? '-ml-1' : ''} border-2 border-white`}></span>
                    ))}
                  </div>
                  {theme.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
