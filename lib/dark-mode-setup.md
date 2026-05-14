# Dark Mode Support Setup Guide

This guide shows how to implement dark mode support using `next-themes` (already installed).

---

## 📋 Overview

The project already has `next-themes` package installed. This setup enables:
- ✅ Light/Dark/System theme modes
- ✅ Persistent theme preference (localStorage)
- ✅ No flash on page load
- ✅ Tailwind CSS dark mode support

---

## 🔧 Implementation Steps

### Step 1: Create Theme Provider Component

Create `components/theme-provider.tsx`:

```typescript
"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

**Parameters:**
- `attribute="class"` - Use class attribute (Tailwind CSS)
- `defaultTheme="system"` - Default to system preference
- `enableSystem` - Detect system theme preference
- `storageKey="theme"` - localStorage key for persistence

### Step 2: Wrap App with Provider

Update `app/layout.tsx`:

```typescript
import { Providers } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <Providers>
          {/* Your layout content */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### Step 3: Update Tailwind Config

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Enable class-based dark mode
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0f172a",
          text: "#f1f5f9",
          border: "#334155",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Step 4: Create Theme Toggle Component

Create `components/theme-toggle.tsx`:

```typescript
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
}
```

### Step 5: Use Theme in Components

```typescript
"use client";

import { useTheme } from "next-themes";

export function MyComponent() {
  const { theme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white">
      Current theme: {theme}
    </div>
  );
}
```

### Step 6: Add Theme Toggle to Header

Add the toggle button to your navigation:

```typescript
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
      <nav className="flex justify-between items-center p-4">
        <h1>BBP System</h1>
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

---

## 🎨 Styling Dark Mode

### Using Tailwind Dark Class

```typescript
// Light mode by default, dark mode with 'dark:' prefix
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content here
</div>
```

### Using CSS Variables

```css
/* In your CSS file */
:root {
  --bg-primary: #ffffff;
  --text-primary: #000000;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --text-primary: #f1f5f9;
  }
}

html.dark {
  color-scheme: dark;
}
```

### Using useTheme Hook

```typescript
import { useTheme } from "next-themes";

export function Card() {
  const { theme } = useTheme();
  
  const bgColor = theme === "dark" ? "#1e293b" : "#ffffff";
  
  return <div style={{ backgroundColor: bgColor }}>...</div>;
}
```

---

## 🚀 Advanced Features

### Force Theme Mode

```typescript
import { useTheme } from "next-themes";

export function AdminPanel() {
  const { forcedTheme, setTheme } = useTheme();

  // Force dark mode in admin panel
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  return <div className="dark">Admin content</div>;
}
```

### Theme Selector

```typescript
"use client";

import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### Theme-Specific Images

```typescript
import Image from "next/image";
import { useTheme } from "next-themes";

export function Logo() {
  const { theme } = useTheme();

  return (
    <Image
      src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="Logo"
      width={40}
      height={40}
    />
  );
}
```

---

## 📦 Dependencies

Already installed:
- ✅ `next-themes@^0.4.6`
- ✅ `tailwindcss@^4.1.9`

---

## 🔍 Troubleshooting

### Flash of Unstyled Content (FOUC)

If you see a flash when the page loads:

```typescript
// In app/layout.tsx, add a script before rendering
<script
  dangerouslySetInnerHTML={{
    __html: `
      try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    `,
  }}
/>
```

### Hydration Mismatch

Always use `useEffect` to prevent hydration issues:

```typescript
useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null;
```

### System Theme Not Detecting

Ensure `enableSystem` is true and the browser supports `prefers-color-scheme`:

```typescript
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  enableColorScheme={false}
>
```

---

## 📚 Resources

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [CSS prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

---

**Last Updated**: 2026-05-14  
**Status**: Ready to Implement
