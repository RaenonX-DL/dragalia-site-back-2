import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  QuestPostListPayload,
  QuestPostListResponse,
  QuestPostPublishPayload, SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {SubscriptionRecord, SubscriptionRecordDocumentKey} from '../../../../thirdparty/mail/data/subscription/model';
import {QuestPostController} from '../controller';


describe(`[Server] GET ${ApiEndPoints.POST_QUEST_LIST} - the quest post listing endpoint`, () => {
  let app: Application;

  const payloadPost: QuestPostPublishPayload = {
    uid: new ObjectId().toHexString(),
    lang: SupportedLanguages.CHT,
    title: 'post',
    general: 'general',
    video: 'video',
    positional: [
      {
        position: 'pos1',
        builds: 'build1',
        rotations: 'rot1',
        tips: 'tip1',
      },
      {
        position: 'pos2',
        builds: 'build2',
        rotations: 'rot2',
        tips: 'tip2',
      },
    ],
    addendum: 'addendum',
    sendUpdateEmail: true,
  };

  const payloadList: QuestPostListPayload = {
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
      await QuestPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_LIST).query(payloadList);
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns an empty result if no post exists yet', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_LIST).query(payloadList);
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns an empty result if no post matches the querying parameters', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_QUEST_LIST)
      .query({...payloadList, lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns nothing if a non-existent language code is used', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_QUEST_LIST)
      .query({...payloadList, lang: 'non-existent'});
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns that the user has subscribed', async () => {
    const uid = new ObjectId();

    await (await SubscriptionRecord.getCollection(app.mongoClient)).insertOne({
      [SubscriptionRecordDocumentKey.key]: {type: 'const', name: 'ALL_QUEST'},
      [SubscriptionRecordDocumentKey.uid]: uid,
    });

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_LIST)
      .query({...payloadList, uid: uid.toHexString()});
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.userSubscribed).toBeTruthy();
  });

  it('returns that the user is not subscribed', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_LIST).query(payloadList);
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.userSubscribed).toBeFalsy();
  });
});
