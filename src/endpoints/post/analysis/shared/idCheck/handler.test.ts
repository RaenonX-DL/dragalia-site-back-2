import {
  AnalysisIdCheckPayload,
  AnalysisIdCheckResponse,
  ApiEndPoints,
  ApiResponseCode,
  CharaAnalysisPublishPayload,
  SupportedLanguages,
  UnitType,
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
    type: UnitType.CHARACTER,
    lang: SupportedLanguages.CHT,
    unitId: 10950101,
    summary: 'summary',
    summonResult: 'summon',
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
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payload);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns available for an unused unit ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      lang: payload.lang,
      unitId: 10950102,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available for an unused language in an used ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      lang: SupportedLanguages.EN,
      unitId: payload.unitId,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns unavailable if unit ID does not exist', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      lang: payload.lang,
      unitId: 7,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for an existing unit ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdmin,
      lang: payload.lang,
      unitId: payload.unitId,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for normal user', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidNormal,
      lang: payload.lang,
      unitId: payload.unitId,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for ads-free user', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      googleUid: uidAdsFree,
      lang: payload.lang,
      unitId: payload.unitId,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(false);
    expect(json.available).toBe(false);
  });
});
