import {MongoError} from 'mongodb';

import {CharaAnalysisPublishPayload, SupportedLanguages, UnitType} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {AnalysisController} from './controller';
import {UnitNotExistsError, UnitTypeMismatchError} from './error';
import {CharaAnalysis, CharaAnalysisDocument} from './model/chara';
import {CharaAnalysisSkillDocumentKey} from './model/charaSkill';
import {UnitAnalysisDocumentKey} from './model/unitAnalysis';

describe(`[Controller] ${AnalysisController.name} (Character)`, () => {
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

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes', async () => {
    const unitId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    expect(unitId).toBe(10950101);

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadChara.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    expect(post.lang).toBe(SupportedLanguages.CHT);
    expect(post.unitId).toBe(10950101);
    expect(post.summary).toBe('summary');
    expect(post.summonResult).toBe('summon');
    expect(post.passives).toBe('passive');
    expect(post.normalAttacks).toBe('normal');
    expect(post.forceStrike).toBe('force');
    expect(post.skills.map((info) => info.toObject())).toStrictEqual([
      {
        [CharaAnalysisSkillDocumentKey.name]: 'skill',
        [CharaAnalysisSkillDocumentKey.info]: 'info',
        [CharaAnalysisSkillDocumentKey.rotations]: 'rot',
        [CharaAnalysisSkillDocumentKey.tips]: 'tips',
      },
    ]);
    expect(post.tipsBuilds).toBe('tips');
    expect(post.videos).toBe('video');
    expect(post.story).toBe('story');
    expect(post.keywords).toBe('keyword');
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.datePublishedEpoch).toEqual(expect.any(Number));
    expect(post.dateModifiedEpoch).toEqual(expect.any(Number));
  });

  it('publishes in an used ID but different language', async () => {
    const unitId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    expect(unitId).toBe(payloadChara.unitId);

    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      lang: SupportedLanguages.EN,
      keywords: 'kw-en',
    });

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadChara.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    expect(post.lang).toBe(SupportedLanguages.EN);
    expect(post.unitId).toBe(10950101);
    expect(post.summary).toBe('summary');
    expect(post.summonResult).toBe('summon');
    expect(post.passives).toBe('passive');
    expect(post.normalAttacks).toBe('normal');
    expect(post.forceStrike).toBe('force');
    expect(post.skills.map((info) => info.toObject())).toStrictEqual([
      {
        [CharaAnalysisSkillDocumentKey.name]: 'skill',
        [CharaAnalysisSkillDocumentKey.info]: 'info',
        [CharaAnalysisSkillDocumentKey.rotations]: 'rot',
        [CharaAnalysisSkillDocumentKey.tips]: 'tips',
      },
    ]);
    expect(post.tipsBuilds).toBe('tips');
    expect(post.videos).toBe('video');
    expect(post.story).toBe('story');
    expect(post.keywords).toBe('kw-en');
  });

  it('publishes analyses in different languages and IDs', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      unitId: 10950101,
      lang: SupportedLanguages.EN,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      unitId: 10950102,
      lang: SupportedLanguages.CHT,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      unitId: 10140101,
      lang: SupportedLanguages.JP,
    });

    let postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.unitId).toBe(10950101);
    postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.unitId).toBe(10950102);
    postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.unitId).toBe(10140101);
  });

  it('blocks publishing duplicated analysis and the content is unchanged', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
    await expect(AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, summary: 'summaryDup'}))
      .rejects
      .toThrow(MongoError);

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadChara.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    // Checks if the content is unchanged
    expect(post.lang).toBe(SupportedLanguages.CHT);
    expect(post.unitId).toBe(10950101);
    expect(post.summary).toBe('summary');
    expect(post.summonResult).toBe('summon');
    expect(post.passives).toBe('passive');
    expect(post.normalAttacks).toBe('normal');
    expect(post.forceStrike).toBe('force');
    expect(post.skills.map((info) => info.toObject())).toStrictEqual([
      {
        [CharaAnalysisSkillDocumentKey.name]: 'skill',
        [CharaAnalysisSkillDocumentKey.info]: 'info',
        [CharaAnalysisSkillDocumentKey.rotations]: 'rot',
        [CharaAnalysisSkillDocumentKey.tips]: 'tips',
      },
    ]);
    expect(post.tipsBuilds).toBe('tips');
    expect(post.videos).toBe('video');
    expect(post.story).toBe('story');
    expect(post.keywords).toBe('keyword');
  });

  it('blocks publishing with non-existent unit ID', async () => {
    await expect(
      AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 7}),
    )
      .rejects
      .toThrow(UnitNotExistsError);
  });

  it('blocks publishing with wrong unit type', async () => {
    await expect(
      AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 20040405}),
    )
      .rejects
      .toThrow(UnitTypeMismatchError);
  });

  it('assigns different ID for different language', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.EN});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.CHT});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.JP});

    let postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.unitId).toBe(payloadChara.unitId);
    postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.unitId).toBe(payloadChara.unitId);
    postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.unitId).toBe(payloadChara.unitId);
  });

  it('edits', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const editResult = await AnalysisController.editCharaAnalysis(
      app.mongoClient,
      {...payloadChara, videos: 'videoEdit', editNote: 'mod'},
    );

    expect(editResult).toBe('UPDATED');

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadChara.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    expect(post.videos).toBe('videoEdit');
    expect(post.editNotes.length).toBe(1);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('edits even if no changes were made', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const editResult = await AnalysisController.editCharaAnalysis(
      app.mongoClient,
      {...payloadChara, editNote: 'mod'},
    );

    expect(editResult).toBe('NO_CHANGE');

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadChara.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    expect(post.videos).toBe(payloadChara.videos);
  });

  it('returns `NOT_FOUND` if the post to be edited not found', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const editResult = await AnalysisController.editCharaAnalysis(
      app.mongoClient,
      {...payloadChara, videos: 'videoEdit', unitId: 10950102, editNote: 'mod'},
    );

    expect(editResult).toBe('NOT_FOUND');
  });
});
