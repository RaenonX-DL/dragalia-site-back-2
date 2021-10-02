import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../../test/data/user';
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
import {AnalysisController} from '../../controller';


describe(`[Server] GET ${ApiEndPoints.POST_ANALYSIS_ID_CHECK} - check analysis ID availability`, () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const payload: CharaAnalysisPublishPayload = {
    uid: uidAdmin,
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
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payload);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns available for an unused unit ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      uid: uidAdmin,
      lang: payload.lang,
      unitId: 10950102,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns available for an unused language in an used ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      uid: uidAdmin,
      lang: SupportedLanguages.EN,
      unitId: payload.unitId,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(true);
  });

  it('returns unavailable if unit ID does not exist', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      uid: uidAdmin,
      lang: payload.lang,
      unitId: 7,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for an existing unit ID', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      uid: uidAdmin,
      lang: payload.lang,
      unitId: payload.unitId,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(false);
  });

  it('returns unavailable for normal user', async () => {
    const payloadIdCheck: AnalysisIdCheckPayload = {
      uid: uidNormal,
      lang: payload.lang,
      unitId: payload.unitId,
    };

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_ID_CHECK).query(payloadIdCheck);
    expect(result.statusCode).toBe(200);

    const json: AnalysisIdCheckResponse = result.json() as AnalysisIdCheckResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.available).toBe(false);
  });
});
