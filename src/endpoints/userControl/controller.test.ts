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

  it('checks if `isAdmin` returns false for the normal user', async () => {
    await GoogleUserController.userLogin(app.mongoClient, '1234567890', 'fake@email.com');
    const isAdmin = await GoogleUserController.isAdmin(app.mongoClient, '1234567890');

    expect(isAdmin).toBe(false);
  });

  it('checks if `isAdmin` returns true for the admin user', async () => {
    await GoogleUserController.userLogin(app.mongoClient, '1234567890', 'fake@email.com', true);
    const isAdmin = await GoogleUserController.isAdmin(app.mongoClient, '1234567890');

    expect(isAdmin).toBe(true);
  });

  it('checks if `getUserData` returns null for non-existent user', async () => {
    const userData = await GoogleUserController.getUserData(app.mongoClient, '1234567890');

    expect(userData).toBeNull();
  });

  it('checks if `getUserData` returns the data of the registered user', async () => {
    await GoogleUserController.userLogin(app.mongoClient, '1234567890', 'fake@email.com');
    const userData = await GoogleUserController.getUserData(app.mongoClient, '1234567890');

    expect(userData?.googleUid).toBe('1234567890');
    expect(userData?.googleEmail).toBe('fake@email.com');
  });
});
