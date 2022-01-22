import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  PostType,
  SubscriptionKey,
  SupportedLanguages,
  SubscriptionGetResponse,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {
  SubscriptionRecord,
  SubscriptionRecordDocument,
  SubscriptionRecordDocumentKey,
} from '../../../../thirdparty/mail/data/subscription/model';


describe('Subscription get all handler', () => {
  let app: Application;

  const uid = new ObjectId();

  const subKeys: SubscriptionKey[] = [
    {type: 'const', name: 'ALL_QUEST'},
    {type: 'post', postType: PostType.QUEST, id: 7},
  ];
  const subRecs: SubscriptionRecordDocument[] = subKeys.map((subKey) => ({
    [SubscriptionRecordDocumentKey.key]: subKey,
    [SubscriptionRecordDocumentKey.uid]: uid,
  }));
  const subKeysBase64: string = Buffer.from(JSON.stringify(subKeys)).toString('base64url');

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await (await SubscriptionRecord.getCollection(app.mongoClient)).insertMany(subRecs);
  });

  afterAll(async () => {
    await app.close();
  });

  it('gets all the subscriptions', async () => {
    const response = await app.app.inject().get(ApiEndPoints.USER_SUBSCRIPTIONS_GET)
      .query({uid, lang: SupportedLanguages.CHT});
    expect(response.statusCode).toBe(200);

    const json: SubscriptionGetResponse = response.json() as SubscriptionGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.subscriptionKeysBase64).toBe(subKeysBase64);
  });
});
