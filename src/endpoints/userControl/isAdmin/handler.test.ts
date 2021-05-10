import {default as request} from 'supertest';

import {
  ApiEndPoints,
  ApiResponseCode,
  UserIsAdminPayload,
  UserIsAdminResponse,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {GoogleUserController} from '../controller';
import {GoogleUser, GoogleUserDocumentKey} from '../model';

describe(`[Server] GET ${ApiEndPoints.USER_IS_ADMIN} - check if user is admin`, () => {
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

  const userPayload: UserIsAdminPayload = {
    googleUid: '88888888',
  };

  const userPayloadEmpty: UserIsAdminPayload = {
    googleUid: '',
  };

  const registerUserAsAdmin = () => {
    GoogleUserController.userLogin(app.mongoClient, userPayload.googleUid, '@', true);
  };

  const registerUserAsNormal = () => {
    GoogleUserController.userLogin(app.mongoClient, userPayload.googleUid, '@', false);
  };

  it('returns true if the user is admin', async () => {
    registerUserAsAdmin();

    const result = await request(app.express).get(ApiEndPoints.USER_IS_ADMIN).query(userPayload);
    expect(result.status).toBe(200);

    const json: UserIsAdminResponse = result.body as UserIsAdminResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.isAdmin).toBe(true);
  });

  it('returns false if the user is not admin', async () => {
    registerUserAsNormal();

    const result = await request(app.express).get(ApiEndPoints.USER_IS_ADMIN).query(userPayload);
    expect(result.status).toBe(200);

    const json: UserIsAdminResponse = result.body as UserIsAdminResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.isAdmin).toBe(false);
  });

  it('returns false if the user ID is empty', async () => {
    const result = await request(app.express).get(ApiEndPoints.USER_IS_ADMIN).query(userPayloadEmpty);
    expect(result.status).toBe(200);

    const json: UserIsAdminResponse = result.body as UserIsAdminResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_EMPTY_USER_ID);
    expect(json.isAdmin).toBe(false);
  });

  it('returns false if the user ID does not exist', async () => {
    const result = await request(app.express).get(ApiEndPoints.USER_IS_ADMIN).query(userPayload);
    expect(result.status).toBe(200);

    const json: UserIsAdminResponse = result.body as UserIsAdminResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_USER_NOT_EXISTS);
    expect(json.isAdmin).toBe(false);
  });

  test('non-existent user is not stored', async () => {
    await request(app.express).get(ApiEndPoints.USER_IS_ADMIN).query(userPayload);

    const docQuery = await GoogleUser.getCollection(await app.mongoClient).findOne(
      {
        [GoogleUserDocumentKey.userId]: userPayload.googleUid,
      },
    );
    expect(docQuery).toBeUndefined();
  });
});
