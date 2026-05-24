import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Database, Code, Shield, Key, HardDrive, Settings, FileText, Zap } from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // All available routes/commands
  const allCommands = [
    { id: 'dashboard', label: 'Dashboard Home', href: '/dashboard', icon: Database },
    { id: 'editor', label: 'Table Editor', href: '/dashboard/editor', icon: Database },
    { id: 'sql', label: 'SQL Editor', href: '/dashboard/sql', icon: Code },
    { id: 'views', label: 'Database Views', href: '/dashboard/views', icon: FileText },
    { id: 'triggers', label: 'Database Triggers', href: '/dashboard/triggers', icon: Zap },
    { id: 'api', label: 'API Builder', href: '/dashboard/api-builder', icon: Code },
    { id: 'keys', label: 'API Keys', href: '/dashboard/keys', icon: Key },
    { id: 'policies', label: 'Policies (RLS)', href: '/dashboard/policies', icon: Shield },
    { id: 'storage', label: 'Storage Buckets', href: '/dashboard/storage', icon: HardDrive },
    { id: 'sdk', label: 'SDK & Network', href: '/dashboard/sdk', icon: Settings },
    { id: 'settings', label: 'System Settings', href: '/dashboard/settings', icon: Settings },
  ];

  // Filter commands
  const filteredCommands = query === '' 
    ? allCommands 
    : allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  // Setup Cmd+K / Ctrl+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard navigation within palette
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          navigate(filteredCommands[selectedIndex].href);
          setIsOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-900/50 backdrop-blur-sm p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 z-0" onClick={() => setIsOpen(false)} />
      
      {/* Palette Modal */}
      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Input Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-slate-100 text-lg placeholder:text-slate-400 font-sans"
            placeholder="Search CaraBase routes..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0); // reset index on search
            }}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 font-bold ml-3 border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Navigation
              </div>
              {filteredCommands.map((command, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = command.icon;
                return (
                  <button
                    key={command.id}
                    onClick={() => {
                      navigate(command.href);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition-colors ${
                      isSelected 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium shadow-sm' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                    {command.label}
                    {isSelected && (
                      <kbd className="ml-auto hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-[10px] font-mono text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Enter
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Use</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">↓</kbd>
            <span>to navigate</span>
          </div>
          <div className="font-bold tracking-widest uppercase opacity-50 text-[10px]">CaraBase OS</div>
        </div>

      </div>
    </div>
  );
}
