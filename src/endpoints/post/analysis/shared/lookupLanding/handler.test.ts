import * as fetch from 'node-fetch';

import {charaData, dragonData} from '../../../../../../test/data/unitInfo.data';
import {
  AnalysisLookupLandingPayload,
  AnalysisLookupLandingResponse,
  ApiEndPoints,
  ApiResponseCode,
  CharaAnalysisPublishPayload,
  SupportedLanguages,
  UnitType,
} from '../../../../../api-def/api';
import {toUnitInfoMap} from '../../../../../api-def/resources/utils/unitInfo';
import * as utils from '../../../../../api-def/resources/utils/unitInfo';
import {Application, createApp} from '../../../../../app';
import {GoogleUserController} from '../../../../userControl/controller';
import {AnalysisController} from '../../controller';


describe(`[Server] GET ${ApiEndPoints.POST_ANALYSIS_LOOKUP_LANDING} - analysis lookup landing`, () => {
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

  const payloadLookup: AnalysisLookupLandingPayload = {
    googleUid: '',
    lang: SupportedLanguages.CHT,
  };

  const unitMap = toUnitInfoMap(charaData, dragonData);

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    // Mock fetch to not to fetch the actual unit Info
    jest.spyOn(fetch, 'default');
    jest.spyOn(utils, 'toUnitInfoMap').mockReturnValue(unitMap);

    await app.reset();
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdmin, 'admin@email.com', true,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the most recently modified analyses', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_LOOKUP_LANDING).query(payloadLookup);
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupLandingResponse = result.json() as AnalysisLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId))
      .toStrictEqual([10950101, 10950201]);
  });

  it('returns at most 3 analyses', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10540401});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10850401});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10850302});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_LOOKUP_LANDING).query(payloadLookup);
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupLandingResponse = result.json() as AnalysisLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId))
      .toStrictEqual([10950101, 10950201, 10850302]);
  });

  it('returns an empty result if no analyses exist yet', async () => {
    const result = await app.app.inject()
      .get(ApiEndPoints.POST_ANALYSIS_LOOKUP_LANDING)
      .query({...payloadLookup, lang: SupportedLanguages.EN});
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupLandingResponse = result.json() as AnalysisLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId)).toStrictEqual([]);
  });

  it('returns nothing if a non-existent language code is used', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_ANALYSIS_LOOKUP_LANDING)
      .query({...payloadLookup, lang: 'non-existent'});
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupLandingResponse = result.json() as AnalysisLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(Object.values(json.analyses).map((entry) => entry.unitId)).toStrictEqual([]);
  });

  it('returns that the user is an admin', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, unitId: 10950201});

    const result = await app.app.inject()
      .get(ApiEndPoints.POST_ANALYSIS_LOOKUP_LANDING)
      .query({...payloadLookup, googleUid: uidAdmin});
    expect(result.statusCode).toBe(200);

    const json: AnalysisLookupLandingResponse = result.json() as AnalysisLookupLandingResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAdmin).toBe(true);
  });
});
