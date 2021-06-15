import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  QuestPostGetPayload,
  QuestPostGetResponse,
  QuestPostPublishPayload,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {QuestPostController} from '../controller';


describe(`[Server] GET ${ApiEndPoints.POST_QUEST_GET} - get a specific quest post`, () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdsFree = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const payloadGet: QuestPostGetPayload = {
    seqId: 1,
    uid: uidNormal,
    lang: SupportedLanguages.CHT,
  };

  const payloadPost: QuestPostPublishPayload = {
    uid: uidAdmin,
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

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdsFree), isAdsFree: true});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
  });

  afterAll(async () => {
    await app.close();
  });

  it('gets an existed post given language and the sequential ID', async () => {
    await QuestPostController.publishPost(app.mongoClient, payloadPost);

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: QuestPostGetResponse = result.json() as QuestPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(json.publishedEpoch).toEqual(expect.any(Number));
    expect(json.modifiedEpoch).toEqual(expect.any(Number));
  });

  it('gets an existed post which has an alt version only given sequential ID', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, lang: SupportedLanguages.EN});

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: QuestPostGetResponse = result.json() as QuestPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(true);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe(SupportedLanguages.EN);
  });

  test('timestamp of edited post is using epoch', async () => {
    const seqId = await QuestPostController.publishPost(app.mongoClient, payloadPost);
    await QuestPostController.editQuestPost(app.mongoClient, {...payloadPost, seqId, video: 'a', editNote: 'edit'});

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: QuestPostGetResponse = result.json() as QuestPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(json.publishedEpoch).toEqual(expect.any(Number));
    expect(json.modifiedEpoch).toEqual(expect.any(Number));
    expect(json.editNotes.length).toBe(1);
    expect(json.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('returns all available languages except the current one', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: SupportedLanguages.EN});
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: SupportedLanguages.JP});

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: QuestPostGetResponse = result.json() as QuestPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    expect(json.otherLangs).toStrictEqual([SupportedLanguages.EN, SupportedLanguages.JP]);
  });

  it('returns nothing as available languages if ID is spread', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: SupportedLanguages.EN});
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 2, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 3, lang: SupportedLanguages.JP});

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 2});
    expect(result.statusCode).toBe(200);

    const json: QuestPostGetResponse = result.json() as QuestPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(2);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    expect(json.otherLangs).toStrictEqual([]);
  });

  it('fails for non-existing post', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    expect(result.statusCode).toBe(404);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('fails if sequence ID is not specified', async () => {
    const {seqId, ...payload} = payloadGet;

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payload);
    expect(result.statusCode).toBe(400);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED);
    expect(json.success).toBe(false);
  });

  it('indicates that the user has the admin privilege', async () => {
    await QuestPostController.publishPost(app.mongoClient, payloadPost);

    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(
      {...payloadGet, uid: uidAdmin},
    );
    expect(result.statusCode).toBe(200);

    const json: QuestPostGetResponse = result.json() as QuestPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });

  it('increments view count per request', async () => {
    await QuestPostController.publishPost(app.mongoClient, payloadPost);

    await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: QuestPostGetResponse = result.json() as QuestPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.viewCount).toBe(4);
  });

  it('increments view count per request on alternative version', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, lang: SupportedLanguages.EN});

    await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    const result = await app.app.inject().get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: QuestPostGetResponse = result.json() as QuestPostGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.lang).toBe(SupportedLanguages.EN);
    expect(json.viewCount).toBe(4);
  });
});
