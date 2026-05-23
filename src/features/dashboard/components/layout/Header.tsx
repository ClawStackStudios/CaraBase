import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "../../../../context/ThemeContext";

interface HeaderProps {
  user: { username: string } | null;
  onToggleSidebar?: () => void;
  title?: string;
}

export function Header({
  user,
  onToggleSidebar,
  title,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-slate-900 border-b-2 border-emerald-500 dark:border-red-500 px-4 md:px-6 py-2 md:py-3 flex-shrink-0 h-16 transition-colors duration-300">
      <div className="flex items-center justify-between gap-4 h-full">
        {/* Left Side: Toggle & Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="text-slate-700 dark:text-slate-300 p-2 h-10 w-10 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          
          {title && (
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1 md:ml-0 truncate">
              {title}
            </span>
          )}
        </div>

        {/* Right Side: Greeting & Actions */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-4">
              <span className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {user.username}
              </span>
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-xs shadow-sm">
                {user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
              </div>
            </div>
          )}

          <button 
            onClick={toggleTheme} 
            className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
