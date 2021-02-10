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
    '!**/node_modules/**',
    '!./src/**/*.test.ts',
    '!./src/api-def/**/*.ts',
  ],
  coverageDirectory: '.',
  coverageReporters: ['clover'],
};
// noinspection JSUnusedGlobalSymbols
export default config;
