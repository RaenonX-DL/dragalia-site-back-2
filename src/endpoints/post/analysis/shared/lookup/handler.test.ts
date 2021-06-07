import {
  AnalysisLookupPayload,
  AnalysisLookupResponse,
  ApiEndPoints,
  ApiResponseCode,
  CharaAnalysisPublishPayload,
  SupportedLanguages,
  UnitType,
} from '../../../../../api-def/api';
import {Application, createApp} from '../../../../../app';
import {GoogleUserController} from '../../../../userControl/controller';
import {AnalysisController} from '../../controller';


describe(`[Server] GET ${ApiEndPoints.POST_ANALYSIS_LOOKUP} - analysis lookup info`, () => {
  let app: Application;

  const uidAdmin = '78787878887';

  const payloadPost: CharaAnalysisPublishPayload = {
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

  const payloadList1: AnalysisLookupPayload = {
    googleUid: '',
    lang: SupportedLanguages.CHT,
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdmin, 'admin@email.com', true,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns correctly', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_LOOKUP).query(payloadList1);
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupResponse = result.json() as AnalysisLookupResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId)).toStrictEqual([10950101, 10950201]);
  });

  it('returns an empty result if no post exists yet', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_LOOKUP).query(payloadList1);
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupResponse = result.json() as AnalysisLookupResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId)).toStrictEqual([]);
  });

  it('returns an empty result if no post matches the querying parameters', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_ANALYSIS_LOOKUP)
      .query({...payloadList1, lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupResponse = result.json() as AnalysisLookupResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId)).toStrictEqual([]);
  });

  it('returns nothing if a non-existent language code is used', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_ANALYSIS_LOOKUP)
      .query({...payloadList1, lang: 'non-existent'});
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupResponse = result.json() as AnalysisLookupResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId)).toStrictEqual([]);
  });

  it('returns that the user is an admin', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_ANALYSIS_LOOKUP)
      .query({...payloadList1, googleUid: uidAdmin});
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupResponse = result.json() as AnalysisLookupResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });
});
