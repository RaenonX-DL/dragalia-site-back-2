import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../test/data/user';
import {ApiEndPoints, ApiResponseCode, PageMetaResponse} from '../../../api-def/api';
import {Application, createApp} from '../../../app';


describe(`[Server] GET ${ApiEndPoints.PAGE_META_GENERAL} - general page meta`, () => {
  let app: Application;

  let uidNormal: ObjectId;
  let uidAdsFree: ObjectId;
  let uidAdmin: ObjectId;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    uidNormal = await insertMockUser(app.mongoClient);
    uidAdsFree = await insertMockUser(app.mongoClient, {isAdsFree: true});
    uidAdmin = await insertMockUser(app.mongoClient, {isAdmin: true});
  });

  afterAll(async () => {
    await app.close();
  });

  test('the return is correct for admin users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_GENERAL).query({
      uid: uidAdmin,
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
      uid: uidAdsFree,
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
      uid: uidNormal,
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
      uid: '',
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
  });
});
