import fs from 'fs';
import path from 'path';

import {rest} from 'msw';
import {setupServer} from 'msw/node';

import {ResourcePaths} from '../src/api-def/resources';

// Console behavior overriding
const originalErrorFn = console.error;
global.console = {
  ...global.console,
  // Override default behavior
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  error: (...data: any[]) => {
    // Skips displaying some error messages
    //  - Attempted to use a session that has ended - mostly happens when cleaning up the tests
    const errorMessage = data[0];
    if (typeof errorMessage !== 'string') {
      originalErrorFn(...data);
      return;
    }

    if (errorMessage.startsWith('MongoDriverError: Attempted to use a session that has ended')) {
      return;
    }
    // The error that causes this error should be printed out
    if (errorMessage.startsWith('Unhandled error')) {
      return;
    }

    originalErrorFn(...data);
  },
};

// Setup mock server
const server = setupServer(
  rest.get('*', async (req, res, ctx) => {
    // Proxy requests that is not for the resources
    if (ResourcePaths.ROOT && !req.url.href.startsWith(ResourcePaths.ROOT)) {
      const response = (await ctx.fetch(req));

      return res(ctx.body(await response.arrayBuffer()));
    }

    // Send static files (resources)
    const fileContent = fs.readFileSync(
      path.join(
        'test',
        'data',
        'resources',
        req.url.href.replace(ResourcePaths.ROOT || '', ''),
      ),
      'utf-8',
    );
    return res(ctx.json(JSON.parse(fileContent)));
  }),
);

// Enable API mocking
beforeAll(() => server.listen({onUnhandledRequest: 'error'}));

// Reset any runtime request handlers added during single test case
afterEach(() => server.resetHandlers());

// Disable API mocking
afterAll(() => server.close());
