import {MongoError} from 'mongodb';

import {SupportedLanguages, CharaAnalysisPublishPayload} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {SeqIdSkippingError} from '../error';
import {AnalysisController} from './controller';
import {CharaAnalysis, CharaAnalysisDocument} from './model/chara';
import {CharaAnalysisSkillDocumentKey} from './model/charaSkill';

describe(`[Controller] ${AnalysisController.name} (Character)`, () => {
  let app: Application;

  const payloadChara: CharaAnalysisPublishPayload = {
    googleUid: 'uid',
    lang: SupportedLanguages.CHT,
    unitId: 7,
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

  it('publishes', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    expect(newSeqId).toBe(1);

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.CHT);
    expect(post.unitId).toBe(7);
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
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    expect(newSeqId).toBe(1);

    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: newSeqId,
      lang: SupportedLanguages.EN,
      keywords: 'kw-en',
    });

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.EN);
    expect(post.unitId).toBe(7);
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

  it('blocks publishing duplicated analysis and the content is unchanged', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1});
    await expect(
      AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, unitId: 99}),
    )
      .rejects
      .toThrow(MongoError);

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    // Checks if the content is unchanged
    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.CHT);
    expect(post.unitId).toBe(7);
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

  it('blocks publishing ID-skipping analysis', async () => {
    await expect(
      AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 7}),
    )
      .rejects
      .toThrow(SeqIdSkippingError);
  });

  it('assigns different ID for different language', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.EN});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.CHT});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: SupportedLanguages.JP});

    let postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.seqId).toBe(1);
    postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.seqId).toBe(2);
    postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.seqId).toBe(3);
  });

  it('publishes posts in different languages and IDs', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 1,
      lang: SupportedLanguages.EN,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 2,
      lang: SupportedLanguages.CHT,
    });
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {
      ...payloadChara,
      seqId: 3,
      lang: SupportedLanguages.JP,
    });

    let postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.seqId).toBe(1);
    postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.seqId).toBe(2);
    postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
    expect(post.seqId).toBe(3);
  });

  it('edits', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const editResult = await AnalysisController.editCharaAnalysis(
      app.mongoClient,
      {...payloadChara, videos: 'videoEdit', seqId: newSeqId, editNote: 'mod'},
    );

    expect(editResult).toBe('UPDATED');

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: newSeqId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    expect(post.videos).toBe('videoEdit');
    expect(post.editNotes.length).toBe(1);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('edits even if no changes were made', async () => {
    const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const editResult = await AnalysisController.editCharaAnalysis(
      app.mongoClient,
      {...payloadChara, seqId: newSeqId, editNote: 'mod'},
    );

    expect(editResult).toBe('NO_CHANGE');

    const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: newSeqId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

    expect(post.videos).toBe(payloadChara.videos);
  });

  it('returns `NOT_FOUND` if the post to be edited not found', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

    const editResult = await AnalysisController.editCharaAnalysis(
      app.mongoClient,
      {...payloadChara, videos: 'videoEdit', seqId: 8, editNote: 'mod'},
    );

    expect(editResult).toBe('NOT_FOUND');
  });
});
