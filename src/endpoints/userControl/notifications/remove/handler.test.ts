import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  PostType,
  SubscriptionRemoveResponse,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {
  SubscriptionRecord,
  SubscriptionRecordDocument,
  SubscriptionRecordDocumentKey,
} from '../../../../thirdparty/mail/data/subscription/model';


describe('Subscription remove handler', () => {
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

    await (await SubscriptionRecord.getCollection(app.mongoClient)).insertMany(subRecs);
  });

  afterAll(async () => {
    await app.close();
  });

  it('removes existing subscription', async () => {
    const response = await app.app.inject().post(ApiEndPoints.USER_SUBSCRIPTIONS_REMOVE).payload({
      uid,
      lang: SupportedLanguages.CHT,
      subKeyBase64: Buffer.from(JSON.stringify(subRecs[0][SubscriptionRecordDocumentKey.key])).toString('base64url'),
    });
    expect(response.statusCode).toBe(200);

    const json: SubscriptionRemoveResponse = response.json() as SubscriptionRemoveResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const doc = await (await SubscriptionRecord.getCollection(app.mongoClient)).findOne();

    expect(doc).toStrictEqual(subRecs[1]);
  });

  it('does not return 500 even if the subscription does not exist', async () => {
    const response = await app.app.inject().post(ApiEndPoints.USER_SUBSCRIPTIONS_REMOVE).payload({
      uid,
      lang: SupportedLanguages.CHT,
      subKeyBase64: Buffer.from('[]').toString('base64url'),
    });
    expect(response.statusCode).toBe(200);

    const json: SubscriptionRemoveResponse = response.json() as SubscriptionRemoveResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const docCount = await (await SubscriptionRecord.getCollection(app.mongoClient)).countDocuments();

    expect(docCount).toStrictEqual(2);
  });
});
