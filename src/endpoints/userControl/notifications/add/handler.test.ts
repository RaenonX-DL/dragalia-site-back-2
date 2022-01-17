import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  PostType,
  SubscriptionAddResponse,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {
  SubscriptionRecord,
  SubscriptionRecordDocument,
  SubscriptionRecordDocumentKey,
} from '../../../../thirdparty/mail/data/subscription/model';


describe('Subscription add handler', () => {
  let app: Application;

  const uid = new ObjectId();

  const subRecs: SubscriptionRecordDocument[] = [
    {
      [SubscriptionRecordDocumentKey.key]: {type: 'const', name: 'ALL_QUEST'},
      [SubscriptionRecordDocumentKey.uid]: uid,
    },
    {
      [SubscriptionRecordDocumentKey.key]: {type: 'post', postType: PostType.QUEST, id: 8},
      [SubscriptionRecordDocumentKey.uid]: uid,
    },
  ];

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    await SubscriptionRecord.getCollection(app.mongoClient).insertMany(subRecs);
  });

  afterAll(async () => {
    await app.close();
  });

  it('adds a subscription', async () => {
    const response = await app.app.inject().post(ApiEndPoints.USER_SUBSCRIPTIONS_ADD).payload({
      uid,
      lang: SupportedLanguages.CHT,
      subKeyBase64: Buffer.from(JSON.stringify({
        [SubscriptionRecordDocumentKey.key]: {type: 'post', postType: PostType.QUEST, id: 7},
        [SubscriptionRecordDocumentKey.uid]: uid,
      })).toString('base64url'),
    });
    expect(response.statusCode).toBe(200);

    const json: SubscriptionAddResponse = response.json() as SubscriptionAddResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const docCount = await SubscriptionRecord.getCollection(app.mongoClient).countDocuments();

    expect(docCount).toBe(3);
  });

  it('does not return 500 if already subscribed', async () => {
    const response = await app.app.inject().post(ApiEndPoints.USER_SUBSCRIPTIONS_ADD).payload({
      uid,
      lang: SupportedLanguages.CHT,
      subKeyBase64: Buffer.from(JSON.stringify(subRecs[0][SubscriptionRecordDocumentKey.key])).toString('base64url'),
    });
    expect(response.statusCode).toBe(200);

    const json: SubscriptionAddResponse = response.json() as SubscriptionAddResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const docs = await SubscriptionRecord.getCollection(app.mongoClient).find().toArray();

    expect(docs).toStrictEqual(subRecs);
  });
});
