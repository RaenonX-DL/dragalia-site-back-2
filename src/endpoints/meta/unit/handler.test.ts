import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  SupportedLanguages,
  UnitPageMetaResponse,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {resetCache} from '../../../utils/resources/loader/cache/main';
import {AlertEntry, AlertEntryKey} from '../alert/model';


describe(`[Server] GET ${ApiEndPoints.PAGE_META_UNIT} - unit page meta`, () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdsFree = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

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
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdsFree), isAdsFree: true});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
    resetCache();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns correct unit name via unit ID', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_UNIT).query({
      uid: uidAdmin,
      lang: SupportedLanguages.EN,
      unitIdentifier: 10950101,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitPageMetaResponse = response.json() as UnitPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
    expect(json.params).toStrictEqual({unitName: 'Gala Leonidas'});
  });

  it('returns correct unit name via unit identifier', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_UNIT).query({
      uid: uidAdmin,
      lang: SupportedLanguages.EN,
      unitIdentifier: 'Gala_Leonidas',
    });
    expect(response.statusCode).toBe(200);

    const json: UnitPageMetaResponse = response.json() as UnitPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
    expect(json.params).toStrictEqual({unitName: 'Gala Leonidas'});
  });

  it('returns unit not found using non-existing unit ID', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_UNIT).query({
      uid: uidAdmin,
      lang: SupportedLanguages.EN,
      unitIdentifier: 7,
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNIT_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns unit not found using non-existing unit identifier', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_UNIT).query({
      uid: uidAdmin,
      lang: SupportedLanguages.EN,
      unitIdentifier: 'a',
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNIT_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns correct props for admin users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_UNIT).query({
      uid: uidAdmin,
      lang: SupportedLanguages.EN,
      unitIdentifier: 10950101,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitPageMetaResponse = response.json() as UnitPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.showAds).toBe(true);
  });

  it('returns correct props for ads-free users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_UNIT).query({
      uid: uidAdsFree,
      lang: SupportedLanguages.EN,
      unitIdentifier: 10950101,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitPageMetaResponse = response.json() as UnitPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(false);
  });

  it('returns correct props for normal users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_UNIT).query({
      uid: uidNormal,
      lang: SupportedLanguages.EN,
      unitIdentifier: 10950101,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitPageMetaResponse = response.json() as UnitPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
  });

  it('returns correct props for anonymous users', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_UNIT).query({
      uid: '',
      lang: SupportedLanguages.EN,
      unitIdentifier: 10950101,
    });
    expect(response.statusCode).toBe(200);

    const json: UnitPageMetaResponse = response.json() as UnitPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.showAds).toBe(true);
  });
});
