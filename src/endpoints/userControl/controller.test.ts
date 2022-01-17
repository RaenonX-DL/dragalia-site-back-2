import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../test/data/user';
import {SupportedLanguages} from '../../api-def/api';
import {DocumentBaseKey, UserDocument, UserDocumentKey} from '../../api-def/models';
import {Application, createApp} from '../../app';
import {UserController} from './controller';
import {UserNotExistsError} from './error';
import {User} from './model';


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

  it('gets user data array', async () => {
    const users: UserDocument[] = [...Array(10).keys()]
      .map((num) => ({
        [DocumentBaseKey.id]: new ObjectId(),
        email: `${num}@example.com`,
        name: num.toString(),
        image: num.toString(),
        isAdmin: false,
        lang: num % 2 === 0 ? SupportedLanguages.CHT : SupportedLanguages.EN,
      }));
    await User.getCollection(app.mongoClient).insertMany(users);

    const dataArray = await UserController.getUserDataOfLang(
      app.mongoClient,
      users.slice(0, 7).map((user) => user[DocumentBaseKey.id] as ObjectId),
      SupportedLanguages.CHT,
    );

    const expected = users.slice(0, 7).filter((doc) => doc[UserDocumentKey.lang] === SupportedLanguages.CHT);
    expect(dataArray).toStrictEqual(expected);
  });
});
