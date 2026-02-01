'use client';

import * as React from 'react';
import { Moon, Sun, Contrast } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Apply high-contrast class to document element
  React.useEffect(() => {
    if (!mounted) {return;}

    const root = document.documentElement;

    if (theme === 'high-contrast-light') {
      root.classList.add('high-contrast');
      root.classList.remove('dark');
    } else if (theme === 'high-contrast-dark') {
      root.classList.add('high-contrast', 'dark');
    } else if (theme === 'dark') {
      root.classList.remove('high-contrast');
      root.classList.add('dark');
    } else {
      root.classList.remove('high-contrast', 'dark');
    }
  }, [theme, mounted]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10">
        <Sun className="w-5 h-5" />
      </Button>
    );
  }

  const currentTheme = theme || resolvedTheme;
  const isDark = currentTheme === 'dark' || currentTheme === 'high-contrast-dark';
  const isHighContrast = currentTheme?.includes('high-contrast');

  const getIcon = () => {
    if (isHighContrast) {
      return <Contrast className="w-5 h-5 text-foreground" />;
    }
    if (isDark) {
      return <Sun className="w-5 h-5 text-foreground" />;
    }
    return <Moon className="w-5 h-5 text-foreground" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 sm:h-10 sm:w-10 touchable"
          aria-label="Switch theme"
        >
          {getIcon()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Theme Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Standard Modes */}
        <div className="py-1">
          <DropdownMenuItem
            onClick={() => setTheme('light')}
            className={`cursor-pointer ${currentTheme === 'light' ? 'bg-accent' : ''}`}
          >
            <Sun className="mr-2 h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Light Mode</span>
              <span className="text-xs text-muted-foreground">
                Warm alabaster theme
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme('dark')}
            className={`cursor-pointer ${currentTheme === 'dark' ? 'bg-accent' : ''}`}
          >
            <Moon className="mr-2 h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Dark Mode</span>
              <span className="text-xs text-muted-foreground">
                Enhanced contrast (7:1)
              </span>
            </div>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">High Contrast (WCAG AAA)</DropdownMenuLabel>

        {/* High Contrast Modes */}
        <div className="py-1">
          <DropdownMenuItem
            onClick={() => setTheme('high-contrast-light')}
            className={`cursor-pointer ${currentTheme === 'high-contrast-light' ? 'bg-accent' : ''}`}
          >
            <Contrast className="mr-2 h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">HC Light</span>
              <span className="text-xs text-muted-foreground">
                Maximum contrast on white
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme('high-contrast-dark')}
            className={`cursor-pointer ${currentTheme === 'high-contrast-dark' ? 'bg-accent' : ''}`}
          >
            <Contrast className="mr-2 h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">HC Dark</span>
              <span className="text-xs text-muted-foreground">
                Maximum contrast on black
              </span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
