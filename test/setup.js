// Test setup file
import { vi } from 'vitest';

// Mock Chrome extension APIs
global.chrome = {
  i18n: {
    getMessage: vi.fn((key) => {
      const messages = {
        'copyToWord': 'Copy Plain Text',
        'copySuccess': 'Copied successfully',
        'copyFailed': 'Copy failed',
        'extensionName': 'PureText One-Click',
        'extensionDescription': 'Copy plain text from AI chat responses'
      };
      return messages[key] || key;
    })
  },
  storage: {
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve())
    }
  }
};

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve())
  },
  writable: true
});

// Mock document.execCommand
document.execCommand = vi.fn(() => true);

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 0));