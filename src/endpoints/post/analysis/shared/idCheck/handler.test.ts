import {default as request} from 'supertest';

import {
  ApiEndPoints,
  ApiResponseCode,
  AnalysisIdCheckPayload,
  CharaAnalysisPublishPayload,
  AnalysisIdCheckResponse,
} from '../../../../../api-def/api';
import {Application, createApp} from '../../../../../app';
import {GoogleUserController} from '../../../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../../../userControl/model';
import {AnalysisController} from '../../controller';

describe(`[Server] GET ${ApiEndPoints.POST_ANALYSIS_ID_CHECK} - check analysis ID availability`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payload: CharaAnalysisPublishPayload = {
    googleUid: uidAdmin,
    seqId: 1,
    lang: 'cht',
    title: 'title',
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
    newPostSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payload);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns available for the next unused ID in the same language', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId + 1,
      lang: payload.lang,
    };

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.status).toBe(200);

    const json: AnalysisIdCheckResponse = result.body as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available if ID is not given', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      lang: payload.lang,
    };

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.status).toBe(200);

    const json: AnalysisIdCheckResponse = result.body as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available for an unused language in the same ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId,
      lang: 'en',
    };

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.status).toBe(200);

    const json: AnalysisIdCheckResponse = result.body as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available for an unused language in the next unused ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId + 1,
      lang: 'en',
    };

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.status).toBe(200);

    const json: AnalysisIdCheckResponse = result.body as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns unavailable for a skipping ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId + 2,
      lang: payload.lang,
    };

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.status).toBe(200);

    const json: AnalysisIdCheckResponse = result.body as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for an existing ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      seqId: newPostSeqId,
      lang: payload.lang,
    };

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.status).toBe(200);

    const json: AnalysisIdCheckResponse = result.body as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for normal user', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidNormal,
      seqId: newPostSeqId + 1,
      lang: payload.lang,
    };

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.status).toBe(200);

    const json: AnalysisIdCheckResponse = result.body as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for ads-free user', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdsFree,
      seqId: newPostSeqId + 1,
      lang: payload.lang,
    };

    const result = await request(app.express).get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.status).toBe(200);

    const json: AnalysisIdCheckResponse = result.body as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.available).toBe(false);
  });
});
