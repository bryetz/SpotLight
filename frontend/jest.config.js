const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // path to Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (if you use them in your project)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
  },
  transformIgnorePatterns: [
    // This is the important part - it tells Jest to transform node_modules/lucide-react
    '/node_modules/(?!(lucide-react|@radix-ui)/)' 
  ],
  preset: 'ts-jest',
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 