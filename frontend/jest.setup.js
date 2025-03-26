// Optional: configure or set up a testing framework before each test
import '@testing-library/jest-dom' 

// Add a mock for ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver; 