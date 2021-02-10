import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  globalSetup: './test/setup.ts',
  globalTeardown: './test/teardown.ts',
};
// noinspection JSUnusedGlobalSymbols
export default config;
