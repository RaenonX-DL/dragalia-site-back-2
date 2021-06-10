

import {
  ApiEndPoints,
  ApiResponseCode,
  QuestPostListPayload,
  QuestPostListResponse,
  QuestPostPublishPayload, SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {UserController} from '../../../userControl/controller';
import {User, UserDocumentKey} from '../../../userControl/model';
import {QuestPostController} from '../controller';

describe(`[Server] GET ${ApiEndPoints.POST_QUEST_LIST} - the quest post listing endpoint`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payloadPost: QuestPostPublishPayload = {
    uid: 'uid',
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
  };

  const payloadList1: QuestPostListPayload = {
    uid: '',
    lang: SupportedLanguages.CHT,
    start: 0,
    limit: 25,
  };

  const payloadList2: QuestPostListPayload = {
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
    await UserController.userLogin(
      app.mongoClient, uidNormal, 'normal@email.com',
    );
    await UserController.userLogin(
      app.mongoClient, uidAdmin, 'admin@email.com', true,
    );
    await UserController.userLogin(
      app.mongoClient, uidAdsFree, 'adsFree@email.com',
    );
    await User.getCollection(app.mongoClient).updateOne(
      {[UserDocumentKey.userId]: uidAdsFree},
      {$set: {[UserDocumentKey.adsFreeExpiry]: new Date(new Date().getTime() + 20000)}},
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns correctly sorted posts', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_LIST).query(payloadList1);
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(7);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns correctly sorted posts after pagination', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_LIST).query(payloadList2);
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(7);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([5, 4]);
  });

  it('returns an empty result if no post exists yet', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_LIST).query(payloadList1);
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns an empty result if no post matches the querying parameters', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_QUEST_LIST)
      .query({...payloadList1, lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns nothing if a non-existent language code is used', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_QUEST_LIST)
      .query({...payloadList1, lang: 'non-existent'});
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns that the user is an admin', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payloadPost);
    }

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_QUEST_LIST)
      .query({...payloadList1, uid: uidAdmin});
    expect(result.statusCode).toBe(200);

    const json: QuestPostListResponse = result.json() as QuestPostListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(7);
  });
});
