import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../test/data/user';
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

  test('if `isAdmin` is false for the normal user', async () => {
    const uid = await insertMockUser(app.mongoClient);
    const isAdmin = await UserController.isAdmin(app.mongoClient, uid);

    expect(isAdmin).toBe(false);
  });

  test('if error thrown if the user does not exists for `isAdmin`', async () => {
    await expect(
      UserController.isAdmin(app.mongoClient, new ObjectId(), true),
    )
      .rejects
      .toThrow(UserNotExistsError);
  });

  test('if `isAdmin` is true for the admin user', async () => {
    const uid = await insertMockUser(app.mongoClient, {isAdmin: true});
    const isAdmin = await UserController.isAdmin(app.mongoClient, uid);

    expect(isAdmin).toBe(true);
  });

  test('if `getUserData` returns null for non-existent user', async () => {
    const userData = await UserController.getUserData(app.mongoClient, new ObjectId());

    expect(userData).toBeNull();
  });
});
