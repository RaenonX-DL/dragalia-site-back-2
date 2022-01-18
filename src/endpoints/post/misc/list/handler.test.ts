import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  MiscPostListPayload,
  MiscPostListResponse,
  MiscPostPublishPayload,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {SubscriptionRecord, SubscriptionRecordDocumentKey} from '../../../../thirdparty/mail/data/subscription/model';
import {MiscPostController} from '../controller';


describe('Misc post listing EP', () => {
  let app: Application;

  const payloadPost: MiscPostPublishPayload = {
    uid: new ObjectId().toHexString(),
    lang: SupportedLanguages.CHT,
    title: 'post',
    sections: [
      {
        title: 'A',
        content: 'A1',
      },
      {
        title: 'B',
        content: 'B1',
      },
    ],
  };

  const payloadList: MiscPostListPayload = {
    uid: '',
    lang: SupportedLanguages.CHT,
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns correctly sorted posts', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_LIST).query(payloadList);
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns an empty result if no post exists yet', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_LIST).query(payloadList);
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns an empty result if no post matches the querying parameters', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_MISC_LIST)
      .query({...payloadList, lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns nothing if a non-existent language code is used', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_MISC_LIST)
      .query({...payloadList, lang: 'non-existent'});
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns that the user has subscribed', async () => {
    const uid = new ObjectId();

    await SubscriptionRecord.getCollection(app.mongoClient).insertOne({
      [SubscriptionRecordDocumentKey.key]: {type: 'const', name: 'ALL_MISC'},
      [SubscriptionRecordDocumentKey.uid]: uid,
    });

    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_LIST)
      .query({...payloadList, uid: uid.toHexString()});
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.userSubscribed).toBeTruthy();
  });

  it('returns that the user is not subscribed', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_LIST).query(payloadList);
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.userSubscribed).toBeFalsy();
  });
});
