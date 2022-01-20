import {
  CharaAnalysisGetResponse,
  CharaAnalysisPublishPayload,
  SupportedLanguages,
  UnitType,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {AnalysisController} from './controller';
import {CharaAnalysis} from './model/chara';
import {UnitAnalysis, UnitAnalysisDocumentKey} from './model/unitAnalysis';
import {GetAnalysisOptions} from './type';


describe(`[Controller] ${AnalysisController.name} (Shared / Read)`, () => {
  let app: Application;

  const payloadChara: CharaAnalysisPublishPayload = {
    uid: 'uid',
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
    sendUpdateEmail: true,
  };
  let getAnalysisOpts: GetAnalysisOptions;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    getAnalysisOpts = {
      mongoClient: app.mongoClient,
      uid: '',
      unitIdentifier: payloadChara.unitId,
      lang: SupportedLanguages.CHT,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it('increases the view count after getting it', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    await AnalysisController.getAnalysis(getAnalysisOpts);
    await AnalysisController.getAnalysis(getAnalysisOpts);
    await AnalysisController.getAnalysis(getAnalysisOpts);
    await AnalysisController.getAnalysis(getAnalysisOpts);
    const getResult = await AnalysisController.getAnalysis(getAnalysisOpts);

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(4);
  });

  it('returns correct analysis using sequential ID', async () => {
    // Insert analysis with seq ID
    const analysis = CharaAnalysis.fromPayload(payloadChara);
    await (await UnitAnalysis
      .getCollection(app.mongoClient))
      .insertOne({...analysis.toObject(), [SequentialDocumentKey.sequenceId]: 1});

    const analysisFromDb = await AnalysisController.getAnalysis({
      ...getAnalysisOpts, unitIdentifier: 1, lang: SupportedLanguages.CHT,
    });
    expect(analysisFromDb?.post[UnitAnalysisDocumentKey.unitId]).toBe(payloadChara.unitId);
  });

  it('returns correct analysis using unit ID', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const analysisFromDb = await AnalysisController.getAnalysis(getAnalysisOpts);
    expect(analysisFromDb?.post[UnitAnalysisDocumentKey.unitId]).toBe(payloadChara.unitId);
  });

  it('does not increase the view count if specified', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    await AnalysisController.getAnalysis({...getAnalysisOpts, incCount: false});
    await AnalysisController.getAnalysis({...getAnalysisOpts, incCount: false});
    await AnalysisController.getAnalysis({...getAnalysisOpts, incCount: false});
    await AnalysisController.getAnalysis({...getAnalysisOpts, incCount: false});
    const getResult = await AnalysisController.getAnalysis(getAnalysisOpts);

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
  });

  it('returns the analysis in an alternative language if main unavailable', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.EN});

    const getResult = await AnalysisController.getAnalysis(getAnalysisOpts);

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[UnitAnalysisDocumentKey.unitId]).toBe(payloadChara.unitId);
  });

  it('returns an empty response for non-existed analysis', async () => {
    const getResult = await AnalysisController.getAnalysis({...getAnalysisOpts, unitIdentifier: 10950102});

    expect(getResult).toBeNull();
  });

  it('returns all available languages of an analysis', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.EN,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.CHT,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.JP,
    });

    const postListResult = await AnalysisController.getAnalysis(getAnalysisOpts);

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([SupportedLanguages.EN, SupportedLanguages.JP]);
  });

  it('does not check for the available languages if view count does not increase', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.EN,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.CHT,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.JP,
    });

    const postListResult = await AnalysisController.getAnalysis({...getAnalysisOpts, incCount: false});

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([]);
  });

  test('if view count behaves correctly according to the specified `incCount`', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.EN,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.CHT,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.JP,
    });

    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.EN});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.EN});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.CHT});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.CHT, incCount: false});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.CHT, incCount: false});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.JP});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.JP});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.JP, incCount: false});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.JP, incCount: false});

    let getResult = await AnalysisController.getAnalysis({
      ...getAnalysisOpts, lang: SupportedLanguages.EN, incCount: false,
    });
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
    getResult = await AnalysisController.getAnalysis({
      ...getAnalysisOpts, lang: SupportedLanguages.CHT, incCount: false,
    });
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(1);
    getResult = await AnalysisController.getAnalysis({
      ...getAnalysisOpts, lang: SupportedLanguages.JP, incCount: false,
    });
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  test('if view count behaves correctly when returning the alternative version', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.EN});

    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.CHT});
    await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.CHT});
    const getResult = await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.CHT});

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  it('returns available for unused unit ID', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(
      app.mongoClient,
      payloadChara.lang,
      10950102,
    );

    expect(availability).toBe(true);
  });

  it('returns available for an unused language in an used ID', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(
      app.mongoClient,
      SupportedLanguages.EN,
      payloadChara.unitId,
    );

    expect(availability).toBe(true);
  });

  it('returns unavailable for an existing unit ID', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(
      app.mongoClient,
      payloadChara.lang,
      payloadChara.unitId,
    );

    expect(availability).toBe(false);
  });

  it('returns unavailable if unit ID does not exist', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(app.mongoClient, payloadChara.lang, 7);

    expect(availability).toBe(false);
  });

  test('skill info of `responseReady()` uses response key', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    const result = await AnalysisController.getAnalysis({...getAnalysisOpts, lang: SupportedLanguages.CHT});

    expect(result).not.toBeNull();

    const response = result?.toResponseReady() as CharaAnalysisGetResponse;

    expect(response.skills.length).toBeGreaterThan(0);

    const firstSkill = response.skills[0];

    expect(firstSkill.name).toBe('skill');
    expect(firstSkill.info).toBe('info');
    expect(firstSkill.rotations).toBe('rot');
    expect(firstSkill.tips).toBe('tips');
  });
});
