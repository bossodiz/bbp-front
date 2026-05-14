# Keyboard Shortcuts Guide

Quick reference for keyboard shortcuts in the Pet Grooming Management System (BBP).

---

## ⌨️ Available Shortcuts

### Navigation
| Shortcut | Action | Description |
|----------|--------|-------------|
| <kbd>⌘</kbd>+<kbd>H</kbd> | Go Home | Navigate to dashboard |
| <kbd>⌘</kbd>+<kbd>K</kbd> | Search | Open search / command palette |
| <kbd>⌘</kbd>+<kbd>/</kbd> | Focus Search | Focus search input field |
| <kbd>⌘</kbd>+<kbd>?</kbd> | Help | Show keyboard shortcuts help |

**Note:** On Windows/Linux, use <kbd>Ctrl</kbd> instead of <kbd>⌘</kbd>

---

### Common Actions
| Shortcut | Action | Description |
|----------|--------|-------------|
| <kbd>⌘</kbd>+<kbd>N</kbd> | New | Create new item |
| <kbd>⌘</kbd>+<kbd>S</kbd> | Save | Save changes |
| <kbd>⌘</kbd>+<kbd>E</kbd> | Edit | Edit selected item |
| <kbd>Delete</kbd> | Delete | Delete selected item |
| <kbd>Esc</kbd> | Close | Close modal or cancel action |

---

### Data Management
| Shortcut | Action | Description |
|----------|--------|-------------|
| <kbd>⌘</kbd>+<kbd>R</kbd> | Refresh | Reload data from server |
| <kbd>⌘</kbd>+<kbd>P</kbd> | Print | Print current page |

---

## 🔧 Implementation in Components

### Using useKeyboardShortcut Hook

```typescript
"use client";

import { useKeyboardShortcut, commonShortcuts } from "@/lib/keyboard-shortcuts";

export function SearchButton() {
  const handleSearch = () => {
    // Open search modal
  };

  useKeyboardShortcut(
    commonShortcuts.search(handleSearch)
  );

  return <button>Search</button>;
}
```

### Using registerShortcut Function

```typescript
"use client";

import { registerShortcut, initializeKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useEffect } from "react";

export function MyApp() {
  useEffect(() => {
    const cleanup = initializeKeyboardShortcuts();

    registerShortcut({
      key: "d",
      meta: true,
      callback: () => console.log("Dashboard"),
      description: "Go to dashboard"
    });

    return cleanup;
  }, []);

  return <div>My App</div>;
}
```

---

## 📖 Adding Custom Shortcuts

### Step 1: Create Shortcut Config

```typescript
import { registerShortcut } from "@/lib/keyboard-shortcuts";

const myShortcut = {
  key: "m",
  meta: true,
  shift: true,
  callback: (event: KeyboardEvent) => {
    console.log("Custom shortcut triggered");
  },
  description: "My custom action"
};
```

### Step 2: Register Shortcut

```typescript
useEffect(() => {
  const unregister = registerShortcut(myShortcut);
  return unregister; // Cleanup
}, []);
```

### Step 3: Display Shortcut Hint

```typescript
import { getShortcutDisplay } from "@/lib/keyboard-shortcuts";

export function MyButton() {
  const shortcutDisplay = getShortcutDisplay(myShortcut);

  return (
    <button title={`${myShortcut.description} (${shortcutDisplay})`}>
      Action
    </button>
  );
}
```

---

## 🎯 Common Preset Shortcuts

The library provides common shortcut presets:

```typescript
import { commonShortcuts } from "@/lib/keyboard-shortcuts";

// Search shortcut
commonShortcuts.search(() => openSearchModal());

// Create new
commonShortcuts.new(() => openCreateModal());

// Save
commonShortcuts.save(() => saveForm());

// Edit
commonShortcuts.edit(() => enterEditMode());

// Delete
commonShortcuts.delete(() => deleteItem());

// Escape
commonShortcuts.escape(() => closeModal());

// Go home
commonShortcuts.goHome(() => router.push('/'));

// Refresh
commonShortcuts.refresh(() => reloadData());

// Focus search
commonShortcuts.focusSearch(() => searchInput.focus());

// Help
commonShortcuts.help(() => openHelpModal());
```

---

## 📱 Platform-Specific Keys

### macOS
- Command key: <kbd>⌘</kbd>
- Option key: <kbd>⌥</kbd>
- Shift key: <kbd>⇧</kbd>
- Control key: <kbd>⌃</kbd>

### Windows/Linux
- Ctrl key: <kbd>Ctrl</kbd>
- Alt key: <kbd>Alt</kbd>
- Shift key: <kbd>Shift</kbd>
- Win key: <kbd>Win</kbd>

---

## 🛑 Disabling Shortcuts in Inputs

Shortcuts are automatically disabled when typing in:
- `<input>` elements
- `<textarea>` elements
- Contenteditable elements

To explicitly handle input cases:

```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement;
  
  // Allow shortcut even in input
  if (target.tagName !== "INPUT") {
    // Handle shortcut
  }
};
```

---

## 🎨 Displaying Shortcuts in UI

### Shortcut Badge

```typescript
import { getShortcutDisplay } from "@/lib/keyboard-shortcuts";
import { Badge } from "@/components/ui/badge";

export function ShortcutBadge({ config }) {
  return (
    <Badge variant="outline">
      {getShortcutDisplay(config)}
    </Badge>
  );
}
```

### Shortcut Hint

```typescript
export function SearchInput() {
  return (
    <input
      placeholder="Search..."
      title="Press ⌘K to search"
    />
  );
}
```

### Help Menu

```typescript
"use client";

import { getAllShortcuts, getShortcutDisplay } from "@/lib/keyboard-shortcuts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShortcutsDialog({ open, onOpenChange }) {
  const shortcuts = getAllShortcuts();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.description} className="flex justify-between">
              <span>{shortcut.description}</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded">
                {getShortcutDisplay(shortcut)}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🚀 Best Practices

### Do's ✅
- Use common shortcuts that users expect
- Disable shortcuts in form inputs
- Provide visual hints (tooltips, badges)
- Use consistent modifiers (Cmd on Mac, Ctrl elsewhere)
- Document all available shortcuts
- Test shortcuts on different platforms

### Don'ts ❌
- Override browser shortcuts (Cmd+T, Cmd+W, etc.)
- Use too many modifier keys (Cmd+Shift+Alt+K)
- Trigger shortcuts in input fields
- Make shortcuts the only way to do something
- Use non-intuitive key combinations

---

## 🧪 Testing Shortcuts

### Example Test

```typescript
import { fireEvent } from "@testing-library/react";
import { registerShortcut } from "@/lib/keyboard-shortcuts";

describe("Keyboard Shortcuts", () => {
  it("should trigger search on Cmd+K", () => {
    const callback = jest.fn();
    registerShortcut({
      key: "k",
      meta: true,
      callback,
      description: "Search"
    });

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true
    });

    fireEvent(document, event);
    expect(callback).toHaveBeenCalled();
  });
});
```

---

## 📚 Resources

- [Keyboard Events - MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)
- [Key Values - MDN](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)
- [Common Shortcuts](https://en.wikipedia.org/wiki/Keyboard_shortcut)

---

## 🤝 Contributing

To add new keyboard shortcuts:

1. Update `lib/keyboard-shortcuts.ts` with new shortcut preset
2. Update this guide with the new shortcut
3. Update the help menu component
4. Add tests for the new shortcut

---

**Last Updated**: 2026-05-14  
**Version**: 1.0.0  
**Status**: Ready to Use
