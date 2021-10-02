import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  CharaAnalysisPublishPayload,
  SupportedLanguages,
  UnitInfoLookupLandingPayload,
  UnitInfoLookupLandingResponse,
  UnitType,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {AnalysisController} from '../../../post/analysis/controller';


describe(`[Server] GET ${ApiEndPoints.INFO_UNIT_LOOKUP_LANDING} - analysis lookup landing`, () => {
  let app: Application;

  const payloadPost: CharaAnalysisPublishPayload = {
    uid: new ObjectId().toHexString(),
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

  const payloadLookup: UnitInfoLookupLandingPayload = {
    uid: '',
    lang: SupportedLanguages.CHT,
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the most recently modified analyses', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});

    const result = await app.app.inject().get(ApiEndPoints.INFO_UNIT_LOOKUP_LANDING).query(payloadLookup);
    expect(result.statusCode).toBe(200);

    const json: UnitInfoLookupLandingResponse = result.json() as UnitInfoLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId))
      .toStrictEqual([10950101, 10950201]);
  });

  it('returns at most 9 analyses', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10530401});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10530501});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10540102});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10540103});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10540201});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10540401});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10850401});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10850302});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});

    const result = await app.app.inject().get(ApiEndPoints.INFO_UNIT_LOOKUP_LANDING).query(payloadLookup);
    expect(result.statusCode).toBe(200);

    const json: UnitInfoLookupLandingResponse = result.json() as UnitInfoLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId))
      .toStrictEqual([
        10950101, 10950201, 10850302, 10850401, 10540401, 10540201, 10540103, 10540102, 10530501,
      ]);
  });

  it('returns an empty result if no analyses exist yet', async () => {
    const result = await app.app.inject()
      .get(ApiEndPoints.INFO_UNIT_LOOKUP_LANDING)
      .query({...payloadLookup, lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: UnitInfoLookupLandingResponse = result.json() as UnitInfoLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId)).toStrictEqual([]);
  });

  it('returns nothing if a non-existent language code is used', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});

    const result = await app.app.inject()
      .get(ApiEndPoints.INFO_UNIT_LOOKUP_LANDING)
      .query({...payloadLookup, lang: 'non-existent'});
    expect(result.statusCode).toBe(200);

    const json: UnitInfoLookupLandingResponse = result.json() as UnitInfoLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId)).toStrictEqual([]);
  });
});
