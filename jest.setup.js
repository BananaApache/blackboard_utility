// Mock Chrome API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://mock-id/${path}`),
    lastError: null
  },
  tabs: {
    query: jest.fn()
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  cookies: {
    getAll: jest.fn()
  },
  downloads: {
    download: jest.fn()
  },
  scripting: {
    executeScript: jest.fn()
  }
};

// Mock fetch
global.fetch = jest.fn();
