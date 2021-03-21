import {default as request} from 'supertest';
import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  QuestPostGetPayload,
  QuestPostGetSuccessResponse,
  QuestPostPublishPayload,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {GoogleUserController} from '../../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../../userControl/model';
import {QuestPostController} from '../controller';

describe(`[Server] GET ${ApiEndPoints.POST_QUEST_GET} - get a specific quest post`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payloadGet: QuestPostGetPayload = {
    googleUid: uidNormal,
    lang: 'cht',
  };

  const payloadPost: QuestPostPublishPayload = {
    googleUid: uidAdmin,
    lang: 'cht',
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('gets an existed post given language and the sequential ID', async () => {
    await QuestPostController.publishPost(app.mongoClient, payloadPost);

    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe('cht');
  });

  it('gets an existed post which has an alt version only given sequential ID', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, lang: 'en'});

    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(true);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe('en');
  });

  it('returns all available languages except the current one', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: 'en'});
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: 'cht'});
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: 'jp'});

    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(1);
    expect(json.lang).toBe('cht');
    expect(json.otherLangs).toStrictEqual(['en', 'jp']);
  });

  it('returns nothing as available languages if ID is spread', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 1, lang: 'en'});
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 2, lang: 'cht'});
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, seqId: 3, lang: 'jp'});

    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 2});
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.seqId).toBe(2);
    expect(json.lang).toBe('cht');
    expect(json.otherLangs).toStrictEqual([]);
  });

  it('returns failure for non-existing post', async () => {
    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    expect(result.status).toBe(404);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns failure if sequence ID is not specified', async () => {
    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query(payloadGet);
    expect(result.status).toBe(400);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED);
    expect(json.success).toBe(false);
  });

  it('indicates that the user should have ads shown', async () => {
    await QuestPostController.publishPost(app.mongoClient, payloadPost);

    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query(
      {...payloadGet, googleUid: uidNormal, seqId: 1},
    );
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.showAds).toBe(true);
  });

  it('indicates that the user has the admin privilege', async () => {
    await QuestPostController.publishPost(app.mongoClient, payloadPost);

    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query(
      {...payloadGet, googleUid: uidAdmin, seqId: 1},
    );
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
  });

  it('indicates that the user is ads-free', async () => {
    await QuestPostController.publishPost(app.mongoClient, payloadPost);

    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query(
      {...payloadGet, googleUid: uidAdsFree, seqId: 1},
    );
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.showAds).toBe(false);
  });

  it('increments view count per request', async () => {
    await QuestPostController.publishPost(app.mongoClient, payloadPost);

    await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.viewCount).toBe(4);
  });

  it('increments view count per request on alternative version', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payloadPost, lang: 'en'});

    await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    const result = await request(app.express).get(ApiEndPoints.POST_QUEST_GET).query({...payloadGet, seqId: 1});
    expect(result.status).toBe(200);

    const json: QuestPostGetSuccessResponse = result.body as QuestPostGetSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.lang).toBe('en');
    expect(json.viewCount).toBe(4);
  });
});
