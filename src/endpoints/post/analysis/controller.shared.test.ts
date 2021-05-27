import {
  CharaAnalysisGetResponse,
  CharaAnalysisPublishPayload,
  DragonAnalysisPublishPayload,
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

describe(`[Controller] ${AnalysisController.name} (Shared / Read)`, () => {
  let app: Application;

  const payloadChara: CharaAnalysisPublishPayload = {
    googleUid: 'uid',
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

  const payloadDragon: DragonAnalysisPublishPayload = {
    googleUid: 'uid',
    type: UnitType.DRAGON,
    lang: SupportedLanguages.CHT,
    unitId: 10,
    summary: 'dragonSummary',
    summonResult: 'dragonSummon',
    normalAttacks: 'dragonNormal',
    ultimate: 'dragonUltimate',
    passives: 'dragonPassive',
    notes: 'dragonNotes',
    suitableCharacters: 'dragonChara',
    videos: 'dragonVideo',
    story: 'dragonStory',
    keywords: 'dragonKeyword',
  };

  const insert3Chara = async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10930401});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10950102});
  };

  const insert3Chara3Dragon = async () => {
    await insert3Chara();
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, unitId: 20030103});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, unitId: 20040102});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, unitId: 20040405});
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

  it('returns analysis meta correctly', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10950102});

    const postListResult = await AnalysisController.getAnalysisLookup(
      app.mongoClient, SupportedLanguages.CHT,
    );

    expect(Object.values(postListResult).map((post) => post.unitId)).toStrictEqual([10950101, 10950102]);
  });

  it('returns without any error if no analysis available', async () => {
    const postListResult = await AnalysisController.getAnalysisLookup(app.mongoClient, SupportedLanguages.CHT);

    expect(Object.keys(postListResult).length).toBe(0);
  });

  it('returns without any error if no analysis matching the language', async () => {
    await insert3Chara();

    const postListResult = await AnalysisController.getAnalysisLookup(app.mongoClient, SupportedLanguages.EN);

    expect(Object.keys(postListResult).length).toBe(0);
  });

  it('returns analysis type for each post entry', async () => {
    await insert3Chara3Dragon();

    const postListResult = await AnalysisController.getAnalysisLookup(app.mongoClient, SupportedLanguages.CHT);

    expect(Object.values(postListResult).filter((entry) => entry.type === UnitType.CHARACTER).length).toBe(3);
    expect(Object.values(postListResult).filter((entry) => entry.type === UnitType.DRAGON).length).toBe(3);
  });

  it('returns modification and publish timestamps for each post entry', async () => {
    await insert3Chara3Dragon();

    const postListResult = await AnalysisController.getAnalysisLookup(app.mongoClient, SupportedLanguages.CHT);

    expect(
      Object.values(postListResult)
        .map((entry) => entry.modifiedEpoch)
        .filter((timestamp) => !!timestamp)
        .length,
    )
      .toBe(6);
    expect(
      Object.values(postListResult)
        .map((entry) => entry.publishedEpoch)
        .filter((timestamp) => !!timestamp)
        .length,
    )
      .toBe(6);
  });

  it('increases the view count after getting it', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT);
    const getResult = await AnalysisController.getAnalysis(
      app.mongoClient,
      payloadChara.unitId,
      SupportedLanguages.CHT,
    );

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(4);
  });

  it('returns correct analysis using sequential ID', async () => {
    // Insert analysis with seq ID
    const analysis = CharaAnalysis.fromPayload(payloadChara);
    await UnitAnalysis
      .getCollection(app.mongoClient)
      .insertOne({...analysis.toObject(), [SequentialDocumentKey.sequenceId]: 1});

    const analysisFromDb = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);
    expect(analysisFromDb?.post[UnitAnalysisDocumentKey.unitId]).toBe(payloadChara.unitId);
  });

  it('returns correct analysis using unit ID', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const analysisFromDb = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT,
    );
    expect(analysisFromDb?.post[UnitAnalysisDocumentKey.unitId]).toBe(payloadChara.unitId);
  });

  it('does not increase the view count if specified', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT, false);
    const getResult = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT,
    );

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
  });

  it('returns the analysis in an alternative language if main unavailable', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.EN});

    const getResult = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT,
    );

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[UnitAnalysisDocumentKey.unitId]).toBe(payloadChara.unitId);
  });

  it('returns an empty response for non-existed analysis', async () => {
    const getResult = await AnalysisController.getAnalysis(app.mongoClient, 10950102, SupportedLanguages.CHT);

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

    const postListResult = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT,
    );

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

    const postListResult = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT, false,
    );

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

    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.EN);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.EN);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.JP);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.JP);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.JP, false);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.JP, false);

    let getResult = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.EN, false,
    );
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
    getResult = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT, false,
    );
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(1);
    getResult = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.JP, false,
    );
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  test('if view count behaves correctly when returning the alternative version', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.EN});

    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT);
    const getResult = await AnalysisController.getAnalysis(
      app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT,
    );

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
    const result = await AnalysisController.getAnalysis(app.mongoClient, payloadChara.unitId, SupportedLanguages.CHT);

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
