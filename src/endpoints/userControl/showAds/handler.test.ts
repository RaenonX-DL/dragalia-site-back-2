

import {
  ApiEndPoints,
  ApiResponseCode,
  UserShowAdsPayload,
  UserShowAdsResponse,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {GoogleUserController} from '../controller';
import {GoogleUser, GoogleUserDocumentKey} from '../model';

describe(`[Server] GET ${ApiEndPoints.USER_SHOW_ADS} - check if user should have ads shown`, () => {
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

  const userPayload: UserShowAdsPayload = {
    googleUid: '88888888',
  };

  const userPayloadEmpty: UserShowAdsPayload = {
    googleUid: '',
  };

  const registerUserAsAdsFree = async () => {
    await GoogleUserController.userLogin(app.mongoClient, userPayload.googleUid, '@', false);
    await GoogleUser.getCollection(app.mongoClient).updateOne({
      [GoogleUserDocumentKey.userId]: userPayload.googleUid,
    }, {
      $set: {
        [GoogleUserDocumentKey.adsFreeExpiry]: new Date(Date.now() + 60000), // Offset 60 seconds
      },
    });
  };

  const registerUserAsNormal = () => {
    GoogleUserController.userLogin(app.mongoClient, userPayload.googleUid, '@', false);
  };

  it('returns true if the user should have ads shown', async () => {
    registerUserAsNormal();

    const result = await app.app.inject().get(ApiEndPoints.USER_SHOW_ADS).query(userPayload);
    expect(result.statusCode).toBe(200);

    const json: UserShowAdsResponse = result.json() as UserShowAdsResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.showAds).toBe(true);
  });

  it('returns false if the user is ads-free', async () => {
    await registerUserAsAdsFree();

    const result = await app.app.inject().get(ApiEndPoints.USER_SHOW_ADS).query(userPayload);
    expect(result.statusCode).toBe(200);

    const json: UserShowAdsResponse = result.json() as UserShowAdsResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.showAds).toBe(false);
  });

  it('returns true if the user ID is empty', async () => {
    const result = await app.app.inject().get(ApiEndPoints.USER_SHOW_ADS).query(userPayloadEmpty);
    expect(result.statusCode).toBe(200);

    const json: UserShowAdsResponse = result.json() as UserShowAdsResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_EMPTY_USER_ID);
    expect(json.showAds).toBe(true);
  });

  it('returns true if the user ID does not exist', async () => {
    const result = await app.app.inject().get(ApiEndPoints.USER_SHOW_ADS).query(userPayload);
    expect(result.statusCode).toBe(200);

    const json: UserShowAdsResponse = result.json() as UserShowAdsResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_USER_NOT_EXISTS);
    expect(json.showAds).toBe(true);
  });

  test('non-existent user is not stored', async () => {
    await app.app.inject().get(ApiEndPoints.USER_SHOW_ADS).query(userPayload);

    const docQuery = await GoogleUser.getCollection(await app.mongoClient).findOne(
      {
        [GoogleUserDocumentKey.userId]: userPayload.googleUid,
      },
    );
    expect(docQuery).toBeUndefined();
  });
});
