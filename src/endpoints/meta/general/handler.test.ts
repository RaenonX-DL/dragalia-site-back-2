import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../test/data/user';
import {ApiEndPoints, ApiResponseCode, PageMetaResponse, SupportedLanguages} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {AlertEntry, AlertEntryKey} from '../alert/model';


describe(`[Server] GET ${ApiEndPoints.PAGE_META_GENERAL} - general page meta`, () => {
  let app: Application;

  let uidNormal: ObjectId;
  let uidAdsFree: ObjectId;
  let uidAdmin: ObjectId;

  const dummyAlerts = [
    {
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
      [AlertEntryKey.message]: 'Alert 1',
      [AlertEntryKey.variant]: 'info',
    },
    {
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
      [AlertEntryKey.message]: 'Alert 2',
      [AlertEntryKey.variant]: 'warning',
    },
  ];

  const insertDummyAlerts = async () => {
    const col = AlertEntry.getCollection(app.mongoClient);
    await col.insertMany(dummyAlerts);
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertDummyAlerts();
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
      lang: SupportedLanguages.EN,
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.showAds).toBe(true);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
  });

  test('the return is correct for ads-free users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_GENERAL).query({
      uid: uidAdsFree,
      lang: SupportedLanguages.EN,
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(false);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
  });

  test('the return is correct for normal users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_GENERAL).query({
      uid: uidNormal,
      lang: SupportedLanguages.EN,
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
  });

  test('the return is correct without user ID', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_GENERAL).query({
      uid: '',
      lang: SupportedLanguages.EN,
    });
    expect(response.statusCode).toBe(200);

    const json: PageMetaResponse = response.json() as PageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
  });
});
