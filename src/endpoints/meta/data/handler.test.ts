import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  DataPageMetaResponse,
  FailedResponse,
  SupportedLanguages,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {KeyPointEntry} from '../../tier/points/model';
import {AlertEntry, AlertEntryKey} from '../alert/model';


describe(`Data page meta handler`, () => {
  let app: Application;

  let keyPointIds: Array<string>;

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

  const insertKeyPointEntries = async () => {
    const dataArray = [
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.EN]: 'EN 1'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.EN]: 'EN 2'}}),
    ].map((entry) => entry.toObject());
    keyPointIds = Object.values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(dataArray)).insertedIds)
      .map((id) => id.toHexString());
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    await insertDummyAlerts();
    await insertKeyPointEntries();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns data type unhandled', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_DATA).query({
      uid: '',
      lang: SupportedLanguages.EN,
      type: 'type',
      id: 'id',
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNHANDLED_DATA_TYPE);
    expect(json.success).toBe(false);
  });

  it('returns data not found', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_DATA).query({
      uid: '',
      lang: SupportedLanguages.EN,
      type: 'tierKeyPoint',
      id: new ObjectId().toHexString(),
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_DATA_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns tier key point title in desired language', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_DATA).query({
      uid: '',
      lang: SupportedLanguages.EN,
      type: 'tierKeyPoint',
      id: keyPointIds[1],
    });
    expect(response.statusCode).toBe(200);

    const json: DataPageMetaResponse = response.json() as DataPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.EN)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
    expect(json.params).toStrictEqual({title: 'EN 2'});
  });

  it('returns tier key point title in alternative language', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_DATA).query({
      uid: '',
      lang: SupportedLanguages.CHT,
      type: 'tierKeyPoint',
      id: keyPointIds[1],
    });
    expect(response.statusCode).toBe(200);

    const json: DataPageMetaResponse = response.json() as DataPageMetaResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.alerts).toStrictEqual(dummyAlerts
      .filter((alert) => alert[MultiLingualDocumentKey.language] === SupportedLanguages.CHT)
      .map((doc) => AlertEntry.fromDocument(doc).toApiEntry()),
    );
    expect(json.params).toStrictEqual({title: 'EN 2'});
  });
});
