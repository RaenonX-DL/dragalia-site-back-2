import {ObjectId} from 'mongodb';

import {
  AnalysisGetPayload,
  ApiEndPoints,
  ApiResponseCode,
  CharaAnalysisGetResponse,
  CharaAnalysisPublishPayload,
  FailedResponse,
  SupportedLanguages,
  UnitType,
} from '../../../../../api-def/api';
import {Application, createApp} from '../../../../../app';
import {AnalysisController} from '../../controller';


describe(`[Server] GET ${ApiEndPoints.POST_ANALYSIS_GET} - get analysis`, () => {
  let app: Application;

  const payloadGet: AnalysisGetPayload = {
    unitId: 10950101,
    incCount: true,
    uid: new ObjectId().toHexString(),
    lang: SupportedLanguages.CHT,
  };

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
    story: 'story',
    keywords: 'keyword',
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

  it('gets an analysis given language and the unit ID', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: CharaAnalysisGetResponse = result.json() as CharaAnalysisGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(json.publishedEpoch).toEqual(expect.any(Number));
    expect(json.modifiedEpoch).toEqual(expect.any(Number));
  });

  it('gets an analysis which has an alt version only given unit ID', async () => {
    await AnalysisController.publishCharaAnalysis(
      app.mongoClient, {...payloadPost, lang: SupportedLanguages.EN},
    );

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: CharaAnalysisGetResponse = result.json() as CharaAnalysisGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(true);
    expect(json.unitId).toBe(payloadGet.unitId);
    expect(json.lang).toBe(SupportedLanguages.EN);
  });

  test('timestamp of edited post is using epoch', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);
    await AnalysisController.editCharaAnalysis(app.mongoClient, {
      ...payloadPost,
      videos: 'a',
      editNote: 'edit',
    });

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: CharaAnalysisGetResponse = result.json() as CharaAnalysisGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.unitId).toBe(payloadGet.unitId);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(json.publishedEpoch).toEqual(expect.any(Number));
    expect(json.modifiedEpoch).toEqual(expect.any(Number));
    expect(json.editNotes.length).toBe(1);
    expect(json.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('returns all available languages except the current one', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, lang: SupportedLanguages.EN});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, lang: SupportedLanguages.CHT});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadPost, lang: SupportedLanguages.JP});

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: CharaAnalysisGetResponse = result.json() as CharaAnalysisGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.unitId).toBe(payloadGet.unitId);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    expect(json.otherLangs).toStrictEqual([SupportedLanguages.EN, SupportedLanguages.JP]);
  });

  it('returns nothing as available languages if unit ID is spread', async () => {
    await AnalysisController.publishCharaAnalysis(
      app.mongoClient, {...payloadPost, lang: SupportedLanguages.CHT},
    );
    await AnalysisController.publishCharaAnalysis(
      app.mongoClient, {...payloadPost, unitId: 10950102, lang: SupportedLanguages.EN},
    );
    await AnalysisController.publishCharaAnalysis(
      app.mongoClient, {...payloadPost, unitId: 10130201, lang: SupportedLanguages.JP},
    );

    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: CharaAnalysisGetResponse = result.json() as CharaAnalysisGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.isAltLang).toBe(false);
    expect(json.unitId).toBe(payloadGet.unitId);
    expect(json.lang).toBe(SupportedLanguages.CHT);
    expect(json.otherLangs).toStrictEqual([]);
  });

  it('fails for non-existing analysis', async () => {
    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    expect(result.statusCode).toBe(404);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('increments view count per request', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadPost);

    await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: CharaAnalysisGetResponse = result.json() as CharaAnalysisGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.viewCount).toBe(4);
  });

  it('increments view count per request on alternative version', async () => {
    await AnalysisController.publishCharaAnalysis(
      app.mongoClient, {...payloadPost, lang: SupportedLanguages.EN},
    );

    await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    const result = await app.app.inject().get(ApiEndPoints.POST_ANALYSIS_GET).query(payloadGet);
    expect(result.statusCode).toBe(200);

    const json: CharaAnalysisGetResponse = result.json() as CharaAnalysisGetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.lang).toBe(SupportedLanguages.EN);
    expect(json.viewCount).toBe(4);
  });
});
