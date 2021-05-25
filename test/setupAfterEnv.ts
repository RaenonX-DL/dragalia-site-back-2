global.console = {
  ...global.console,
  // Override default behavior
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
