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
  globalTeardown: './test/teardown.ts',
  // Coverage
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**/*.ts',
    // Node environment files
    '!**/node_modules/**',
    // Main file (server entry point)
    '!./src/main.ts',
    // Testing files
    '!./src/**/*.test.ts',
    // API definitions
    '!./src/api-def/**/*.ts',
  ],
  coverageDirectory: '.',
  coverageReporters: ['clover'],
};
// noinspection JSUnusedGlobalSymbols
export default config;
