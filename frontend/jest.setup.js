// Optional: configure or set up a testing framework before each test
import '@testing-library/jest-dom' 

// Mock ResizeObserver (if needed by components)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver (needed for components using it, e.g., for infinite scroll)
class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
window.IntersectionObserver = IntersectionObserver; // Assign the mock to the window object 