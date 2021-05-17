import {ApiEndPoints, ApiResponseCode, PageMetaResponse} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {GoogleUserController} from '../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../userControl/model';

describe(`[Server] GET ${ApiEndPoints.PAGE_META_GENERAL} - general page meta`, () => {
  let app: Application;

  const uidNormal = 'uidNormal';
  const uidAdsFree = 'uidAdsFree';
  const uidAdmin = 'uidAdmin';

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await GoogleUserController.userLogin(
      app.mongoClient, uidNormal, 'normal@email.com',
    );
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdmin, 'admin@email.com', true,
    );
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdsFree, 'adsFree@email.com',
    );
    await GoogleUser.getCollection(app.mongoClient).updateOne(
      {[GoogleUserDocumentKey.userId]: uidAdsFree},
      {$set: {[GoogleUserDocumentKey.adsFreeExpiry]: new Date(new Date().getTime() + 20000)}},
    );
  });

  afterAll(async () => {
    await app.close();
  });

  test('the return is correct for admin users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_GENERAL).query({
      googleUid: uidAdmin,
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.showAds).toBe(true);
  });

  test('the return is correct for ads-free users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_GENERAL).query({
      googleUid: uidAdsFree,
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(false);
  });

  test('the return is correct for normal users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_GENERAL).query({
      googleUid: uidNormal,
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
  });

  test('the return is correct without user ID', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_GENERAL).query({
      googleUid: '',
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
  });
});
