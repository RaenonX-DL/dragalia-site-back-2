import {
  AnalysisType,
  CharaAnalysisPublishPayload,
  DragonAnalysisPublishPayload,
  SupportedLanguages,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {CharaAnalysisResponse} from './base/response';
import {AnalysisController} from './controller';

describe(`[Controller] ${AnalysisController.name} (Shared / Read)`, () => {
  let app: Application;

  const payloadChara: CharaAnalysisPublishPayload = {
    googleUid: 'uid',
    lang: SupportedLanguages.CHT,
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

  const payloadDragon: DragonAnalysisPublishPayload = {
    googleUid: 'uid',
    lang: SupportedLanguages.CHT,
    title: 'dragon',
    summary: 'dragonSummary',
    summon: 'dragonSummon',
    normalAttacks: 'dragonNormal',
    ultimate: 'dragonUltimate',
    passives: 'dragonPassive',
    notes: 'dragonNotes',
    suitableCharacters: 'dragonChara',
    videos: 'dragonVideo',
    story: 'dragonStory',
    keywords: 'dragonKeyword',
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

  it('increments `nextSeqId` per request', async () => {
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {})).toBe(1);
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {})).toBe(2);
  });

  it('increments `nextSeqId` after request', async () => {
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {})).toBe(1);
  });

  it('does not increment `nextSeqId` if specified', async () => {
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
  });

  test('if `nextSeqId` is working as expected', async () => {
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {increase: true})).toBe(1);
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {increase: false})).toBe(1);
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {increase: true})).toBe(2);
    expect(await AnalysisController.getNextSeqId(app.mongoClient, {increase: true})).toBe(3);
  });

  it('returns correctly-sorted analysis', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    }

    const postListResult = await AnalysisController.getAnalysisList(
      app.mongoClient, SupportedLanguages.CHT, 0, 25,
    );

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns correctly-sorted analysis if paginated', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    }

    const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, SupportedLanguages.CHT, 2, 2);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([5, 4]);
  });

  it('returns without any error if no analysis available', async () => {
    const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, SupportedLanguages.CHT, 2, 2);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns without any error if no analysis matching the language', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    }

    const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, SupportedLanguages.EN, 0, 25);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns correct post count', async () => {
    for (let i = 0; i < 7; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    }

    const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, SupportedLanguages.CHT, 0, 25);

    expect(postListResult.totalAvailableCount).toBe(7);
  });

  it('returns analysis type for each post entry', async () => {
    for (let i = 0; i < 3; i++) {
      await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    }

    const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, SupportedLanguages.CHT, 0, 25);

    expect(postListResult.totalAvailableCount).toBe(6);
    expect(postListResult.postListEntries.map((entry) => entry.type)).toStrictEqual([
      AnalysisType.CHARACTER, AnalysisType.DRAGON,
      AnalysisType.CHARACTER, AnalysisType.DRAGON,
      AnalysisType.CHARACTER, AnalysisType.DRAGON,
    ]);
  });

  it('returns correct post count after pagination', async () => {
    for (let i = 0; i < 30; i++) {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    }

    const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, SupportedLanguages.CHT, 0, 25);

    expect(postListResult.totalAvailableCount).toBe(30);
  });

  it('increases the view count after getting it', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);
    const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(4);
  });

  it('does not increase the view count if specified', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT, false);
    const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
  });

  it('returns the analysis in an alternative language if main unavailable', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.EN});

    const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[SequentialDocumentKey.sequenceId]).toBe(1);
  });

  it('returns an empty response for non-existed analysis', async () => {
    const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult).toBeNull();
  });

  it('returns all available languages of a analysis', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.EN,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.CHT,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.JP,
    });

    const postListResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([SupportedLanguages.EN, SupportedLanguages.JP]);
  });

  it('does not check for the available languages if view count does not increase', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.EN,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.CHT,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.JP,
    });

    const postListResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT, false);

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([]);
  });

  test('if view count behaves correctly according to the specified `incCount`', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.EN,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.CHT,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.JP,
    });

    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.EN);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.EN);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.JP);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.JP);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.JP, false);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.JP, false);

    let getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.EN, false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
    getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT, false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(1);
    getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.JP, false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  test('if view count behaves correctly when returning the alternative version', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.EN});

    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);
    await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);
    const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  it('returns available for the next unused ID in the same language', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(
      app.mongoClient,
      payloadChara.lang,
      newSeqId + 1,
    );

    expect(availability).toBe(true);
  });

  it('returns available if ID is not given', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(app.mongoClient, payloadChara.lang);

    expect(availability).toBe(true);
  });

  it('returns available for an unused language in the same ID', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(
      app.mongoClient,
      SupportedLanguages.EN,
      newSeqId,
    );

    expect(availability).toBe(true);
  });

  it('returns available for an unused language in the next unused ID', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(
      app.mongoClient,
      SupportedLanguages.EN,
      newSeqId + 1,
    );

    expect(availability).toBe(true);
  });

  it('returns unavailable for a skipping ID', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(
      app.mongoClient,
      payloadChara.lang,
      newSeqId + 2,
    );

    expect(availability).toBe(false);
  });

  it('returns unavailable for an existing ID', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(
      app.mongoClient,
      payloadChara.lang,
      newSeqId,
    );

    expect(availability).toBe(false);
  });

  it('returns unavailable if ID is negative', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const availability = await AnalysisController.isAnalysisIdAvailable(app.mongoClient, payloadChara.lang, -8);

    expect(availability).toBe(false);
  });

  test('skill info of `responseReady()` uses response key', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    const result = await AnalysisController.getAnalysis(app.mongoClient, newSeqId);

    expect(result).not.toBeNull();

    const response = result?.toResponseReady() as CharaAnalysisResponse;

    expect(response.skills.length).toBeGreaterThan(0);

    const firstSkill = response.skills[0];

    expect(firstSkill.name).toBe('skill');
    expect(firstSkill.info).toBe('info');
    expect(firstSkill.rotations).toBe('rot');
    expect(firstSkill.tips).toBe('tips');
  });
});
