import fs from 'fs';
import path from 'path';

import {rest} from 'msw';
import {setupServer} from 'msw/node';

import {ResourcePaths} from '../src/api-def/resources';

// Console behavior override
global.console = {
  ...global.console,
  // Override default behavior
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
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
beforeAll(() => server.listen());

// Reset any runtime request handlers added during single test case
afterEach(() => server.resetHandlers());

// Disable API mocking
afterAll(() => server.close());
