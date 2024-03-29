import type {Config} from '@jest/types';


const config: Config.InitialOptions = {
  // Basic options
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  // Test setup
  globalSetup: './test/setup.ts',
  setupFilesAfterEnv: ['./test/setupAfterEnv.ts'],
  globalTeardown: './test/teardown.ts',
  // Coverage
  collectCoverageFrom: [
    // Source files
    './src/**/*.ts',
    // Node environment files
    '!**/node_modules/**',
    // Main file (server entry point)
    '!./src/main.ts',
    // Init file (server initialization utils)
    '!./src/utils/init/**/*.ts',
    // Testing files
    '!./src/**/*.test.ts',
    // API definitions
    '!./src/api-def/**/*.ts',
  ],
  coverageDirectory: '.',
  coverageReporters: [
    'clover',
    'cobertura',
  ],
};

// noinspection JSUnusedGlobalSymbols
export default config;
