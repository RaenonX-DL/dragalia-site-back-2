import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  PostType,
  SubscriptionKey,
  SubscriptionUpdateResponse,
  SupportedLanguages,
} from '../../../../api-def/api';
import {DocumentBaseKey} from '../../../../api-def/models';
import {Application, createApp} from '../../../../app';
import {
  SubscriptionRecord,
  SubscriptionRecordDocument,
  SubscriptionRecordDocumentKey,
} from '../../../../thirdparty/mail/data/subscription/model';


describe('Subscription batch update handler', () => {
  let app: Application;

  const uid = new ObjectId();

  const subKeys: SubscriptionKey[] = [
    {type: 'const', name: 'ALL_QUEST'},
    {type: 'post', postType: PostType.QUEST, id: 7},
  ];
  const subKeysBase64: string = Buffer.from(JSON.stringify(subKeys)).toString('base64url');

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('adds new subscriptions of a user if not existed before', async () => {
    const response = await app.app.inject().post(ApiEndPoints.USER_SUBSCRIPTIONS_UPDATE).payload({
      uid,
      lang: SupportedLanguages.CHT,
      subKeysBase64,
    });
    expect(response.statusCode).toBe(200);

    const json: SubscriptionUpdateResponse = response.json() as SubscriptionUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const docs = (await SubscriptionRecord.getCollection(app.mongoClient)
      .find()
      .toArray() as SubscriptionRecordDocument[])
      .map((entry) => {
        delete entry[DocumentBaseKey.id];

        return entry;
      });

    expect(docs).toStrictEqual(subKeys.map((key) => ({
      [SubscriptionRecordDocumentKey.key]: key,
      [SubscriptionRecordDocumentKey.uid]: uid,
    })));
  });

  it('updates the subscriptions of a user', async () => {
    await SubscriptionRecord.getCollection(app.mongoClient).insertMany([
      {
        [SubscriptionRecordDocumentKey.key]: {type: 'const', name: 'ALL_QUEST'},
        [SubscriptionRecordDocumentKey.uid]: uid,
      },
      {
        [SubscriptionRecordDocumentKey.key]: {type: 'post', postType: PostType.QUEST, id: 8},
        [SubscriptionRecordDocumentKey.uid]: uid,
      },
    ]);

    const response = await app.app.inject().post(ApiEndPoints.USER_SUBSCRIPTIONS_UPDATE).payload({
      uid,
      lang: SupportedLanguages.CHT,
      subKeysBase64,
    });
    expect(response.statusCode).toBe(200);

    const json: SubscriptionUpdateResponse = response.json() as SubscriptionUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const docs = (await SubscriptionRecord.getCollection(app.mongoClient)
      .find()
      .toArray() as SubscriptionRecordDocument[])
      .map((entry) => {
        delete entry[DocumentBaseKey.id];

        return entry;
      });

    expect(docs).toStrictEqual(subKeys.map((key) => ({
      [SubscriptionRecordDocumentKey.key]: key,
      [SubscriptionRecordDocumentKey.uid]: uid,
    })));
  });

  it('completely removes the subscriptions of a user', async () => {
    await SubscriptionRecord.getCollection(app.mongoClient).insertMany(subKeys.map((key) => ({
      [SubscriptionRecordDocumentKey.key]: key,
      [SubscriptionRecordDocumentKey.uid]: uid,
    })));

    const response = await app.app.inject().post(ApiEndPoints.USER_SUBSCRIPTIONS_UPDATE).payload({
      uid,
      lang: SupportedLanguages.CHT,
      subKeysBase64: Buffer.from('[]', 'base64url').toString(),
    });
    expect(response.statusCode).toBe(200);

    const json: SubscriptionUpdateResponse = response.json() as SubscriptionUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const count = await SubscriptionRecord.getCollection(app.mongoClient).countDocuments();

    expect(count).toBe(0);
  });
});
