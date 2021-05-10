import {default as request} from 'supertest';

import {ApiEndPoints, ApiResponseCode, FailedResponse, UserLoginPayload, UserLoginResponse} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {GoogleUser, GoogleUserDocument, GoogleUserDocumentKey} from '../model';

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
    googleEmail: 'fake@gmail.com',
    googleUid: '88888888',
  };

  const userPayloadEmpty: UserLoginPayload = {
    googleEmail: '',
    googleUid: '',
  };

  it('registers a new user', async () => {
    const result = await request(app.express).post(ApiEndPoints.USER_LOGIN).send(userPayload);
    expect(result.status).toBe(200);

    const json: UserLoginResponse = result.body as UserLoginResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS_NEW);
    expect(json.success).toBe(true);
  });

  it('knows an user has registered', async () => {
    const supertestApp = request(app.express);

    // Initial call
    await supertestApp.post(ApiEndPoints.USER_LOGIN).send(userPayload);

    const result = await supertestApp.post(ApiEndPoints.USER_LOGIN).send(userPayload);

    expect(result.status).toBe(200);

    const json: UserLoginResponse = result.body as UserLoginResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });

  it('stores the user data', async () => {
    await request(app.express).post(ApiEndPoints.USER_LOGIN).send(userPayload);

    const docQuery = await GoogleUser.getCollection(await app.mongoClient).findOne(
      {
        [GoogleUserDocumentKey.userId]: userPayload.googleUid,
        [GoogleUserDocumentKey.email]: userPayload.googleEmail,
      },
    );
    const doc = GoogleUser.fromDocument(docQuery as GoogleUserDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.loginCount).toEqual(1);
    expect(doc.lastLogin.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.isAdmin).toEqual(false);
  });

  it('fails if the login data is malformed', async () => {
    const result = await request(app.express).post(ApiEndPoints.USER_LOGIN).send(userPayloadEmpty);
    expect(result.status).toBe(200);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_EMPTY_LOGIN_DATA);
    expect(json.success).toBe(false);
  });
});
