

import {
  ApiEndPoints,
  ApiResponseCode,
  QuestPostIdCheckPayload,
  QuestPostIdCheckResponse,
  QuestPostPublishPayload, SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {GoogleUserController} from '../../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../../userControl/model';
import {QuestPostController} from '../controller';

describe(`[Server] GET ${ApiEndPoints.POST_QUEST_ID_CHECK} - check ID availability of a quest post`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payloadPost: QuestPostPublishPayload = {
    googleUid: uidAdmin,
    seqId: 1,
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

  let newPostSeqId: number;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await GoogleUserController.userLogin(
      app.mongoClient, uidNormal, 'normal@email.com',
    );
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdmin, 'admin@email.com', true,
    );
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdsFree, 'adsFree@email.com',
    );
    await GoogleUser.getCollection(app.mongoClient).updateOne(
      {[GoogleUserDocumentKey.userId]: uidAdsFree},
      {$set: {[GoogleUserDocumentKey.adsFreeExpiry]: new Date(new Date().getTime() + 20000)}},
    );
    newPostSeqId = await QuestPostController.publishPost(app.mongoClient, payloadPost);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns available for the next unused ID in the same language', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId + 1,
      lang: payloadPost.lang,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: QuestPostIdCheckResponse = result.json() as QuestPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available if ID is not given', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      googleUid: uidAdmin,
      lang: payloadPost.lang,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: QuestPostIdCheckResponse = result.json() as QuestPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available for an unused language in the same ID', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId,
      lang: SupportedLanguages.EN,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: QuestPostIdCheckResponse = result.json() as QuestPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available for an unused language in the next unused ID', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId + 1,
      lang: SupportedLanguages.EN,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: QuestPostIdCheckResponse = result.json() as QuestPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns unavailable for a skipping ID', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId + 2,
      lang: payloadPost.lang,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: QuestPostIdCheckResponse = result.json() as QuestPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for an existing ID', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId,
      lang: payloadPost.lang,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: QuestPostIdCheckResponse = result.json() as QuestPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(false);
  });
});
