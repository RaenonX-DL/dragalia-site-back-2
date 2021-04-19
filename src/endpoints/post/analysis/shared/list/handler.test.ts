import {default as request} from 'supertest';

import {
  ApiEndPoints,
  AnalysisListPayload,
  CharaAnalysisPublishPayload,
  AnalysisListResponse,
  ApiResponseCode,
} from '../../../../../api-def/api';
import {Application, createApp} from '../../../../../app';
import {GoogleUserController} from '../../../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../../../userControl/model';
import {AnalysisController} from '../../controller';


describe(`[Server] GET ${ApiEndPoints.POST_ANALYSIS_LIST} - list analysis`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payloadPost: CharaAnalysisPublishPayload = {
    googleUid: uidAdmin,
    lang: 'cht',
    title: 'name',
    summary: 'summary',
    summon: 'summon',
    passives: 'passive',
    normalAttacks: 'normal',
    forceStrikes: 'force',
    skills: [{
      name: 'skill',
      info: 'info',
      rotations: 'rot',
      tips: 'tips',
    }],
    tipsBuilds: 'tips',
    videos: 'video',
    story: 'story',
    keywords: 'keyword',
  };

  const payloadList1: AnalysisListPayload = {
    googleUid: '',
    langCode: 'cht',
    start: 0,
    limit: 25,
  };

  const payloadList2: AnalysisListPayload = {
    googleUid: '',
    langCode: 'cht',
    start: 2,
    limit: 2,
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

  it('returns correctly sorted posts', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);
    }

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_LIST).query(payloadList1);
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(7);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns correctly sorted posts after pagination', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);
    }

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_LIST).query(payloadList2);
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(7);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([5, 4]);
  });

  it('returns an empty result if no post exists yet', async () => {
    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_LIST).query(payloadList1);
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns an empty result if no post matches the querying parameters', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);
    }

    const result = await request(app.express)
      .get(ApiEndPoints.POST_ANALYSIS_LIST)
      .query({...payloadList1, langCode: 'en'});
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns nothing if a non-existent language code is used', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);
    }

    const result = await request(app.express)
      .get(ApiEndPoints.POST_ANALYSIS_LIST)
      .query({...payloadList1, langCode: 'non-existent'});
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(0);
    expect(json.posts.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns that the user is an admin', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);
    }

    const result = await request(app.express)
      .get(ApiEndPoints.POST_ANALYSIS_LIST)
      .query({...payloadList1, googleUid: uidAdmin});
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(7);
    expect(json.isAdmin).toBe(true);
  });

  it('returns that the non-ads-free user should have ads shown', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);

    const result = await request(app.express)
      .get(ApiEndPoints.POST_ANALYSIS_LIST)
      .query({...payloadList1, googleUid: uidNormal});
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(1);
    expect(json.showAds).toBe(true);
  });

  it('returns that the ads-free user should not have ads shown', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);

    const result = await request(app.express)
      .get(ApiEndPoints.POST_ANALYSIS_LIST)
      .query({...payloadList1, googleUid: uidAdsFree});
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(1);
    expect(json.showAds).toBe(false);
  });

  it('returns that unregistered user should have ads shown', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);

    const result = await request(app.express)
      .get(ApiEndPoints.POST_ANALYSIS_LIST)
      .query(payloadList1);
    expect(result.status).toBe(200);

    const json: AnalysisListResponse = result.body as AnalysisListResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.postCount).toBe(1);
    expect(json.showAds).toBe(true);
  });
});
