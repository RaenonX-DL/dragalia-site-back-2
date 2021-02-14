import {Application, createApp} from '../../app';
import {GoogleUserController} from './controller';

describe(`[Controller] ${GoogleUserController.name}`, () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('checks if `userLogin` returns true on newly registered user', async () => {
    const isNew = await GoogleUserController.userLogin(
      app.mongoClient, '1234567890', 'fake@email.com',
    );

    expect(isNew).toBe(true);
  });

  it('checks if `userLogin` returns false on registered user', async () => {
    await GoogleUserController.userLogin(app.mongoClient, '1234567890', 'fake@email.com');
    const isNew = await GoogleUserController.userLogin(
      app.mongoClient, '1234567890', 'fake@email.com',
    );

    expect(isNew).toBe(false);
  });
});
