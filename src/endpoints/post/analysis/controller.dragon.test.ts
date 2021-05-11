import {MongoError} from 'mongodb';

import {SupportedLanguages, DragonAnalysisPublishPayload} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {SeqIdSkippingError} from '../error';
import {AnalysisController} from './controller';
import {DragonAnalysis, DragonAnalysisDocument} from './model/dragon';

describe(`[Controller] ${AnalysisController.name} (Dragon)`, () => {
  let app: Application;

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

  it('publishes', async () => {
    const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    expect(newSeqId).toBe(1);

    const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.CHT);
    expect(post.title).toBe('dragon');
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.passives).toBe('dragonPassive');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
    expect(post.story).toBe('dragonStory');
    expect(post.keywords).toBe('dragonKeyword');
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.datePublishedEpoch).toEqual(expect.any(Number));
    expect(post.dateModifiedEpoch).toEqual(expect.any(Number));
  });

  it('publishes in an used ID but different language', async () => {
    const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    expect(newSeqId).toBe(1);

    await AnalysisController.publishDragonAnalysis(app.mongoClient, {
      ...payloadDragon,
      seqId: newSeqId,
      lang: SupportedLanguages.EN,
      keywords: 'kw-en',
    });

    const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.EN);
    expect(post.title).toBe('dragon');
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.passives).toBe('dragonPassive');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
    expect(post.story).toBe('dragonStory');
    expect(post.keywords).toBe('kw-en');
  });

  it('publishes successfully', async () => {
    const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    expect(newSeqId).toBe(1);

    const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.CHT);
    expect(post.title).toBe('dragon');
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.passives).toBe('dragonPassive');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
    expect(post.story).toBe('dragonStory');
    expect(post.keywords).toBe('dragonKeyword');
  });

  it('publishes in an used ID but different language', async () => {
    const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    expect(newSeqId).toBe(1);

    await AnalysisController.publishDragonAnalysis(app.mongoClient, {
      ...payloadDragon,
      seqId: newSeqId,
      lang: SupportedLanguages.EN,
      keywords: 'kw-en',
    });

    const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.EN);
    expect(post.title).toBe('dragon');
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.passives).toBe('dragonPassive');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
    expect(post.story).toBe('dragonStory');
    expect(post.keywords).toBe('kw-en');
  });

  it('blocks publishing duplicated analysis and the content is unchanged', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 1});
    await expect(
      AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 1, title: 'duplicated'}),
    )
      .rejects
      .toThrow(MongoError);

    const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    // Checks if the content is unchanged
    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.CHT);
    expect(post.title).toBe('dragon');
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.passives).toBe('dragonPassive');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
    expect(post.story).toBe('dragonStory');
    expect(post.keywords).toBe('dragonKeyword');
  });

  it('blocks publishing duplicated analysis and the content is unchanged', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 1});
    await expect(
      AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 1, title: 'duplicated'}),
    )
      .rejects
      .toThrow(MongoError);

    const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    // Checks if the content is unchanged
    expect(post.seqId).toBe(1);
    expect(post.language).toBe(SupportedLanguages.CHT);
    expect(post.title).toBe('dragon');
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.passives).toBe('dragonPassive');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
    expect(post.story).toBe('dragonStory');
    expect(post.keywords).toBe('dragonKeyword');
  });

  it('blocks publishing ID-skipping analysis', async () => {
    await expect(
      AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 7}),
    )
      .rejects
      .toThrow(SeqIdSkippingError);
  });

  it('assigns different ID for different language', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: SupportedLanguages.EN});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: SupportedLanguages.CHT});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: SupportedLanguages.JP});

    let postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.seqId).toBe(1);
    postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.seqId).toBe(2);
    postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.seqId).toBe(3);
  });

  it('publishes posts in different languages and IDs', async () => {
    await AnalysisController.publishDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, seqId: 1, lang: SupportedLanguages.EN},
    );
    await AnalysisController.publishDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, seqId: 2, lang: SupportedLanguages.CHT},
    );
    await AnalysisController.publishDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, seqId: 3, lang: SupportedLanguages.JP},
    );

    let postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.seqId).toBe(1);
    postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.seqId).toBe(2);
    postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.seqId).toBe(3);
  });

  it('edits', async () => {
    const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    const editResult = await AnalysisController.editDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, videos: 'videoEdit', seqId: newSeqId, editNote: 'mod'},
    );

    expect(editResult).toBe('UPDATED');

    const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: newSeqId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    expect(post.videos).toBe('videoEdit');
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('edits even if no changes were made', async () => {
    const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    const editResult = await AnalysisController.editDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, seqId: newSeqId, editNote: 'mod'},
    );

    expect(editResult).toBe('NO_CHANGE');
  });

  it('returns `NOT_FOUND` if the post to be edited is not found', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    const editResult = await AnalysisController.editDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, videos: 'videoEdit', seqId: 8, editNote: 'mod'},
    );

    expect(editResult).toBe('NOT_FOUND');
  });
});
