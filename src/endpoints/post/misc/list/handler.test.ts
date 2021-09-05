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

  const payloadList1: MiscPostListPayload = {
    uid: '',
    lang: SupportedLanguages.CHT,
    start: 0,
    limit: 25,
  };

  const payloadList2: MiscPostListPayload = {
    uid: '',
    lang: SupportedLanguages.CHT,
    start: 2,
    limit: 2,
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

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_LIST).query(payloadList1);
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(7);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns correctly sorted posts after pagination', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_LIST).query(payloadList2);
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(7);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([5, 4]);
  });

  it('returns an empty result if no post exists yet', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_LIST).query(payloadList1);
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns an empty result if no post matches the querying parameters', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_MISC_LIST)
      .query({...payloadList1, lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns nothing if a non-existent language code is used', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_MISC_LIST)
      .query({...payloadList1, lang: 'non-existent'});
    expect(result.statusCode).toBe(200);

    const json: MiscPostListResponse = result.json() as MiscPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });
});
