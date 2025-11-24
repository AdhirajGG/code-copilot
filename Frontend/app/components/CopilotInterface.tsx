'use client';

import React, { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco, atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp';
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java';
import { Copy, Loader2, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import { colors } from '@/lib/colors';

SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('java', java);


interface CopilotInterfaceProps {
  darkMode: boolean;
}

type ToastType = 'success' | 'error' | 'info';
type ToastItem = { id: string; message: string; type?: ToastType; duration?: number };

export default function CopilotInterface({ darkMode }: CopilotInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);


  const [copiedMain, setCopiedMain] = useState(false); 
  const [copiedModal, setCopiedModal] = useState(false); 


  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const theme = darkMode ? colors.dark : colors.light;
  const languages = ['javascript', 'python', 'cpp', 'java'];

  const addToast = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: ToastItem = { id, message, type, duration };
    setToasts((t) => [...t, item]);

    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, duration);
  };


  const fetchHistory = async (pageNum: number) => {
    try {
      const res = await fetch(`/api/history?page=${pageNum}`);
      const data = await res.json();
      setHistory(data.data);
      setTotalPages(data.totalPages);
      setPage(data.currentPage);
    } catch (err) {
      console.error('Failed to fetch history');
      addToast('Failed to fetch history', 'error');
    }
  };

  useEffect(() => { fetchHistory(1); }, []);


  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast('Please enter a prompt', 'error');
      return;
    }

    setLoading(true);
    setGeneratedCode('');

    try {
const res = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt, language }),
});
const json = await res.json();

const code = json?.data?.code ?? json?.code ?? json?.generated ?? '';
setGeneratedCode(code);
      addToast('Code generated', 'success');
      fetchHistory(1);
    } catch (err) {
      addToast('Error generating code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };


  const copyToClipboardWithToast = async (text: string, scope: 'main' | 'modal') => {
    try {
      await navigator.clipboard.writeText(text);
      addToast('Code copied to clipboard!', 'success');
      if (scope === 'main') {
        setCopiedMain(true);
        setTimeout(() => setCopiedMain(false), 2000);
      } else {
        setCopiedModal(true);
        setTimeout(() => setCopiedModal(false), 2000);
      }
    } catch (err) {
      addToast('Failed to copy', 'error');
    }
  };

  return(
    <>
      
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-3 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full px-4 py-3 rounded-lg shadow-md border ${
              t.type === 'success' ? 'bg-green-600 text-white border-green-700' :
              t.type === 'error' ? 'bg-red-600 text-white border-red-700' :
              'bg-gray-800 text-white border-gray-700'
            }`}
            role="status"
          >
            <div className="text-sm">{t.message}</div>
          </div>
        ))}
      </div>

    
      {selectedHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`${theme.card} ${theme.border} border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden ${theme.shadow} animate-in zoom-in duration-200`}>
          
            <div className={`p-6 ${theme.border} border-b flex justify-between items-start`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${theme.lCard}`}>
                    {selectedHistory.language}
                  </span>
                  <span className={`text-xs ${theme.textTertiary}`}>
                    {new Date(selectedHistory.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-xl font-bold">Prompt</h3>
                <p className={`${theme.textSecondary} mt-2`}>{selectedHistory.prompt}</p>
              </div>
              <button
                onClick={() => setSelectedHistory(null)}
                className={`p-2 rounded-lg ${theme.buttonSecondary} transition-all duration-200 ml-4`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Generated Code</h3>
                <button
                  onClick={() => copyToClipboardWithToast(selectedHistory.code, 'modal')}
                  className={`flex items-center gap-2 px-4 py-2 ${theme.buttonTertiary} rounded-lg text-sm transition-all duration-200`}
                >
                  <Copy size={16} />
                  <span>{copiedModal ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className={`${theme.code} ${theme.border} border rounded-xl overflow-hidden`}>
                <div className="overflow-auto">
                  <SyntaxHighlighter
                    language={selectedHistory.language}
                    style={darkMode ? atomOneDark : docco}
                    customStyle={{
                      background: 'transparent',
                      padding: '1.5rem',
                      margin: 0,
                      fontSize: '0.875rem'
                    }}
                    showLineNumbers
                  >
                    {selectedHistory.code}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    
      <div className="max-w-7xl mx-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
          <div className="lg:col-span-2">
            <div className={`${theme.card} ${theme.border} ${theme.shadow} border rounded-2xl p-8 transition-all duration-300`}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h2 className="text-2xl font-bold">Generate Code</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme.textSecondary}`}>
                    Describe what you want to build
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyPress}
                    rows={4}
                    className={`w-full p-4 ${theme.input} ${theme.border} border rounded-xl resize-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200`}
                    placeholder="e.g., Create a function that fetches user data from an API and displays it in a table..."
                  />
                  <p className={`text-xs ${theme.textTertiary} mt-1`}>
                    Press Cmd/Ctrl + Enter to generate
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${theme.textSecondary}`}>
                    Programming Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className={`w-full p-4 ${theme.input} ${theme.border} border rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200`}
                  >
                    {languages.map((l) => (
                      <option key={l} value={l} className={darkMode ? 'bg-gray-800' : 'bg-white'}>
                        {l.charAt(0).toUpperCase() + l.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                    ${loading || !prompt.trim()
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : `${theme.button} ${theme.buttonText}`
                    }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate Code</span>
                    </>
                  )}
                </button>
              </div>

           
              {generatedCode && (
                <div className="mt-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Generated Code</h3>
                    <button
                      onClick={() => copyToClipboardWithToast(generatedCode, 'main')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${theme.buttonSecondary}`}
                      title="Copy to Clipboard"
                    >
                      <Copy size={16} />
                      <span>{copiedMain ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className={`${theme.code} ${theme.border} border rounded-xl overflow-hidden`}>
                    <div className="overflow-auto max-h-[500px]">
                      <SyntaxHighlighter
                        language={language}
                        style={darkMode ? atomOneDark : docco}
                        customStyle={{
                          background: 'transparent',
                          padding: '1.5rem',
                          margin: 0,
                          fontSize: '0.875rem'
                        }}
                        showLineNumbers
                      >
                        {generatedCode}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

     
          <div className="lg:col-span-1">
            <div className={`${theme.card} ${theme.border} ${theme.shadow} border rounded-2xl overflow-hidden transition-all duration-300`}>
              <div className={`p-6 ${theme.border} border-b`}>
                <button
                  onClick={() => setHistoryCollapsed(!historyCollapsed)}
                  className="w-full flex items-center justify-between group"
                >
                  <h2 className="text-xl font-bold">History</h2>
                  <div className={`p-2 rounded-lg ${theme.buttonSecondary} transition-all duration-300`}>
                    {historyCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </div>
                </button>
              </div>

              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  historyCollapsed ? 'max-h-0' : 'max-h-[800px]'
                }`}
              >
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {history.length === 0 ? (
                    <div className={`text-center py-12 ${theme.textTertiary}`}>
                      <p className="text-sm">No history yet</p>
                      <p className="text-xs mt-1">Generated code will appear here</p>
                    </div>
                  ) : (
                    history.map((item, idx) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedHistory(item)}
                        className={`p-4 ${theme.border} border rounded-xl ${theme.cardHover} transition-all duration-200 cursor-pointer transform hover:scale-[1.02]`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${theme.lCard}`}>
                            {item.language}
                          </span>
                          <span className={`text-xs ${theme.textTertiary}`}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm font-medium mb-2 ${theme.textSecondary} line-clamp-2`}>
                          {item.prompt}
                        </p>
                        <div className={`${theme.code} p-2 rounded-lg text-xs font-mono ${theme.textTertiary} truncate`}>
                          {item.code.substring(0, 50)}...
                        </div>
                      </div>
                    ))
                  )}
                </div>

               
                {totalPages > 1 && (
                  <div className={`p-4 ${theme.border} border-t flex justify-between items-center`}>
                    <button
                      disabled={page <= 1}
                      onClick={() => fetchHistory(page - 1)}
                      className={`px-4 py-2 text-sm ${theme.buttonSecondary} rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200`}
                    >
                      Previous
                    </button>
                    <span className={`text-sm ${theme.textTertiary} font-medium`}>
                      {page} / {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => fetchHistory(page + 1)}
                      className={`px-4 py-2 text-sm ${theme.buttonSecondary} rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
