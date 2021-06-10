import {Application, createApp} from '../../app';
import {UserController} from './controller';
import {UserNotExistsError} from './error';

describe(`[Controller] ${UserController.name}`, () => {
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

  it('returns true for newly registered user', async () => {
    const isNew = await UserController.userLogin(
      app.mongoClient, '1234567890', 'fake@email.com',
    );

    expect(isNew).toBe(true);
  });

  it('returns false for registered user', async () => {
    await UserController.userLogin(app.mongoClient, '1234567890', 'fake@email.com');
    const isNew = await UserController.userLogin(
      app.mongoClient, '1234567890', 'fake@email.com',
    );

    expect(isNew).toBe(false);
  });

  test('if `isAdmin` is false for the normal user', async () => {
    await UserController.userLogin(app.mongoClient, '1234567890', 'fake@email.com');
    const isAdmin = await UserController.isAdmin(app.mongoClient, '1234567890');

    expect(isAdmin).toBe(false);
  });

  test('if error thrown if the user does not exists for `isAdmin`', async () => {
    await expect(
      UserController.isAdmin(app.mongoClient, '1234567890', true),
    )
      .rejects
      .toThrow(UserNotExistsError);
  });

  test('if `isAdmin` is true for the admin user', async () => {
    await UserController.userLogin(app.mongoClient, '1234567890', 'fake@email.com', true);
    const isAdmin = await UserController.isAdmin(app.mongoClient, '1234567890');

    expect(isAdmin).toBe(true);
  });

  test('if `getUserData` returns null for non-existent user', async () => {
    const userData = await UserController.getUserData(app.mongoClient, '1234567890');

    expect(userData).toBeNull();
  });

  test('if `getUserData` returns the data of the registered user', async () => {
    await UserController.userLogin(app.mongoClient, '1234567890', 'fake@email.com');
    const userData = await UserController.getUserData(app.mongoClient, '1234567890');

    expect(userData?.uid).toBe('1234567890');
    expect(userData?.email).toBe('fake@email.com');
  });
});
