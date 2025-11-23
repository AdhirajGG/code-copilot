'use client';

import { useState } from 'react';
import CopilotInterface from './components/CopilotInterface';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { colors } from '@/lib/colors';
export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const theme = darkMode ? colors.dark : colors.light;

  return (
    <main className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300 p-4 md:p-8`}>
   
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className={`text-3xl font-bold ${theme.text} bg-clip-text `}>
            Code Copilot
          </h1>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-xl ${theme.buttonSecondary} transition-all duration-300`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <CopilotInterface darkMode={darkMode} />
    </main>
  );
}