import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  MiscPostIdCheckPayload,
  MiscPostIdCheckResponse,
  MiscPostPublishPayload,
  QuestPostIdCheckPayload,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {MiscPostController} from '../controller';


describe('Misc post ID check EP', () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const payloadPost: MiscPostPublishPayload = {
    uid: uidAdmin,
    seqId: 1,
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
    sendUpdateEmail: true,
  };

  let newPostSeqId: number;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
    newPostSeqId = (await MiscPostController.publishPost(app.mongoClient, payloadPost)).seqId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns available for the next unused ID in the same language', async () => {
    const payloadIdCheck: MiscPostIdCheckPayload = {
      uid: uidAdmin,
      seqId: newPostSeqId + 1,
      lang: payloadPost.lang,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: MiscPostIdCheckResponse = result.json() as MiscPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available if ID is not given', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      uid: uidAdmin,
      lang: payloadPost.lang,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: MiscPostIdCheckResponse = result.json() as MiscPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available for an unused language in the same ID', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      uid: uidAdmin,
      seqId: newPostSeqId,
      lang: SupportedLanguages.EN,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: MiscPostIdCheckResponse = result.json() as MiscPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns unavailable for an unused language in the next unused ID', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      uid: uidAdmin,
      seqId: newPostSeqId + 1,
      lang: SupportedLanguages.EN,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: MiscPostIdCheckResponse = result.json() as MiscPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for a skipping ID', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      uid: uidAdmin,
      seqId: newPostSeqId + 2,
      lang: payloadPost.lang,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: MiscPostIdCheckResponse = result.json() as MiscPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for an existing ID', async () => {
    const payloadIdCheck: QuestPostIdCheckPayload = {
      uid: uidAdmin,
      seqId: newPostSeqId,
      lang: payloadPost.lang,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_MISC_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: MiscPostIdCheckResponse = result.json() as MiscPostIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(false);
  });
});
