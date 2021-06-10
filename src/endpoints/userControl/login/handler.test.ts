

import {ApiEndPoints, ApiResponseCode, FailedResponse, UserLoginPayload, UserLoginResponse} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {User, UserDocument, UserDocumentKey} from '../model';

describe(`[Server] GET ${ApiEndPoints.USER_LOGIN} - the user login endpoint`, () => {
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

  const userPayload: UserLoginPayload = {
    email: 'fake@gmail.com',
    uid: '88888888',
  };

  const userPayloadEmpty: UserLoginPayload = {
    email: '',
    uid: '',
  };

  it('registers a new user', async () => {
    const result = await app.app.inject().post(ApiEndPoints.USER_LOGIN).payload(userPayload);
    expect(result.statusCode).toBe(200);

    const json: UserLoginResponse = result.json() as UserLoginResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS_NEW);
    expect(json.success).toBe(true);
  });

  it('knows an user has registered', async () => {
    // Initial call
    await app.app.inject().post(ApiEndPoints.USER_LOGIN).payload(userPayload);

    const result = await app.app.inject().post(ApiEndPoints.USER_LOGIN).payload(userPayload);

    expect(result.statusCode).toBe(200);

    const json: UserLoginResponse = result.json() as UserLoginResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });

  it('stores the user data', async () => {
    await app.app.inject().post(ApiEndPoints.USER_LOGIN).payload(userPayload);

    const docQuery = await User.getCollection(await app.mongoClient).findOne(
      {
        [UserDocumentKey.userId]: userPayload.uid,
        [UserDocumentKey.email]: userPayload.email,
      },
    );
    const doc = User.fromDocument(docQuery as UserDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.loginCount).toEqual(1);
    expect(doc.lastLogin.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.isAdmin).toEqual(false);
  });

  it('fails if the login data is malformed', async () => {
    const result = await app.app.inject().post(ApiEndPoints.USER_LOGIN).payload(userPayloadEmpty);
    expect(result.statusCode).toBe(200);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_EMPTY_LOGIN_DATA);
    expect(json.success).toBe(false);
  });
});
