import {MongoError} from 'mongodb';

import {CharaAnalysisPublishPayload, DragonAnalysisPublishPayload} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {SeqIdSkippingError} from '../error';
import {AnalysisController} from './controller';
import {
  CharaAnalysis,
  CharaAnalysisDocument,
  CharaAnalysisSkillDocumentKey,
  DragonAnalysis,
  DragonAnalysisDocument,
} from './model';

describe(`[Controller] ${AnalysisController.name}`, () => {
  let app: Application;

  const payloadChara: CharaAnalysisPublishPayload = {
    googleUid: 'uid',
    lang: 'cht',
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
    lang: 'cht',
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

  describe(`[Controller] ${AnalysisController.name} (Shared / Read)`, () => {
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

      const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, 'cht', 0, 25);

      expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
    });

    it('returns correctly-sorted analysis if paginated', async () => {
      for (let i = 0; i < 7; i++) {
        await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
      }

      const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, 'cht', 2, 2);

      expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([5, 4]);
    });

    it('returns without any error if no analysis available', async () => {
      const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, 'cht', 2, 2);

      expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
    });

    it('returns without any error if no analysis matching the language', async () => {
      for (let i = 0; i < 7; i++) {
        await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
      }

      const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, 'en', 0, 25);

      expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
    });

    it('returns correct post count', async () => {
      for (let i = 0; i < 7; i++) {
        await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
      }

      const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, 'cht', 0, 25);

      expect(postListResult.totalAvailableCount).toBe(7);
    });

    it('returns correct post count after pagination', async () => {
      for (let i = 0; i < 30; i++) {
        await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);
      }

      const postListResult = await AnalysisController.getAnalysisList(app.mongoClient, 'cht', 0, 25);

      expect(postListResult.totalAvailableCount).toBe(30);
    });

    it('increases the view count after getting it', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');
      const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');

      expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(4);
    });

    it('does not increase the view count if specified', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht', false);
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht', false);
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht', false);
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht', false);
      const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');

      expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
    });

    it('returns the analysis in an alternative language if main unavailable', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: 'en'});

      const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');

      expect(getResult?.isAltLang).toBe(true);
      expect(getResult?.post[MultiLingualDocumentKey.language]).toBe('en');
      expect(getResult?.post[SequentialDocumentKey.sequenceId]).toBe(1);
    });

    it('returns an empty response for non-existed analysis', async () => {
      const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');

      expect(getResult).toBeNull();
    });

    it('returns all available languages of a analysis', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'en'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'cht'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'jp'});

      const postListResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');

      expect(postListResult?.isAltLang).toBe(false);
      expect(postListResult?.otherLangs).toStrictEqual(['en', 'jp']);
    });

    it('does not check for the available languages if view count does not increase', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'en'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'cht'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'jp'});

      const postListResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht', false);

      expect(postListResult?.isAltLang).toBe(false);
      expect(postListResult?.otherLangs).toStrictEqual([]);
    });

    test('if view count behaves correctly according to the specified `incCount`', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'en'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'cht'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'jp'});

      await AnalysisController.getAnalysis(app.mongoClient, 1, 'en');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'en');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht', false);
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht', false);
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'jp');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'jp');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'jp', false);
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'jp', false);

      let getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'en', false);
      expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
      getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht', false);
      expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(1);
      getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'jp', false);
      expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
    });

    test('if view count behaves correctly when returning the alternative version', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: 'en'});

      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');
      await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');
      const getResult = await AnalysisController.getAnalysis(app.mongoClient, 1, 'cht');

      expect(getResult?.isAltLang).toBe(true);
      expect(getResult?.post[MultiLingualDocumentKey.language]).toBe('en');
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

      const availability = await AnalysisController.isAnalysisIdAvailable(app.mongoClient, 'en', newSeqId);

      expect(availability).toBe(true);
    });

    it('returns available for an unused language in the next unused ID', async () => {
      const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

      const availability = await AnalysisController.isAnalysisIdAvailable(
        app.mongoClient,
        'en',
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
  });

  describe(`[Controller] ${AnalysisController.name} (Character)`, () => {
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
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

      expect(post.seqId).toBe(1);
      expect(post.language).toBe('cht');
      expect(post.title).toBe('name');
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

    it('publishes in an used ID but different language', async () => {
      const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

      expect(newSeqId).toBe(1);

      await AnalysisController.publishCharaAnalysis(app.mongoClient, {
        ...payloadChara,
        seqId: newSeqId,
        lang: 'en',
        keywords: 'kw-en',
      });

      const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: 1,
        [MultiLingualDocumentKey.language]: 'en',
      });
      const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

      expect(post.seqId).toBe(1);
      expect(post.language).toBe('en');
      expect(post.title).toBe('name');
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
        AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, title: 'duplicated'}),
      )
        .rejects
        .toThrow(MongoError);

      const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: 1,
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

      // Checks if the content is unchanged
      expect(post.seqId).toBe(1);
      expect(post.language).toBe('cht');
      expect(post.title).toBe('name');
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
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: 'en'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: 'cht'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, lang: 'jp'});

      let postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'en',
      });
      let post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
      expect(post.seqId).toBe(1);
      postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'cht',
      });
      post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
      expect(post.seqId).toBe(2);
      postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'jp',
      });
      post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
      expect(post.seqId).toBe(3);
    });

    it('publishes posts in different languages and IDs', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, lang: 'en'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 2, lang: 'cht'});
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 3, lang: 'jp'});

      let postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'en',
      });
      let post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
      expect(post.seqId).toBe(1);
      postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'cht',
      });
      post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
      expect(post.seqId).toBe(2);
      postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'jp',
      });
      post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);
      expect(post.seqId).toBe(3);
    });

    it('edits', async () => {
      const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

      const editResult = await AnalysisController.editCharaAnalysis(
        app.mongoClient,
        {...payloadChara, videos: 'videoEdit', seqId: newSeqId, modifyNote: 'mod'},
      );

      expect(editResult).toBe('UPDATED');

      const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: newSeqId,
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

      expect(post.videos).toBe('videoEdit');
    });

    it('edits even if no changes were made', async () => {
      const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

      const editResult = await AnalysisController.editCharaAnalysis(
        app.mongoClient,
        {...payloadChara, seqId: newSeqId, modifyNote: 'mod'},
      );

      expect(editResult).toBe('NO_CHANGE');

      const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: newSeqId,
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

      expect(post.videos).toBe(payloadChara.videos);
    });

    it('returns `NOT_FOUND` if the post to be edited not found', async () => {
      await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

      const editResult = await AnalysisController.editCharaAnalysis(
        app.mongoClient,
        {...payloadChara, videos: 'videoEdit', seqId: 8, modifyNote: 'mod'},
      );

      expect(editResult).toBe('NOT_FOUND');
    });
  });

  describe(`[Controller] ${AnalysisController.name} (Dragon)`, () => {
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
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

      expect(post.seqId).toBe(1);
      expect(post.language).toBe('cht');
      expect(post.title).toBe('name');
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

    it('publishes in an used ID but different language', async () => {
      const newSeqId = await AnalysisController.publishCharaAnalysis(app.mongoClient, payloadChara);

      expect(newSeqId).toBe(1);

      await AnalysisController.publishCharaAnalysis(app.mongoClient, {
        ...payloadChara,
        seqId: newSeqId,
        lang: 'en',
        keywords: 'kw-en',
      });

      const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: 1,
        [MultiLingualDocumentKey.language]: 'en',
      });
      const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

      expect(post.seqId).toBe(1);
      expect(post.language).toBe('en');
      expect(post.title).toBe('name');
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

    it('publishes successfully', async () => {
      const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

      expect(newSeqId).toBe(1);

      const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: 1,
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

      expect(post.seqId).toBe(1);
      expect(post.language).toBe('cht');
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
        lang: 'en',
        keywords: 'kw-en',
      });

      const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: 1,
        [MultiLingualDocumentKey.language]: 'en',
      });
      const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

      expect(post.seqId).toBe(1);
      expect(post.language).toBe('en');
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
      await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1});
      await expect(
        AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, seqId: 1, title: 'duplicated'}),
      )
        .rejects
        .toThrow(MongoError);

      const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: 1,
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = CharaAnalysis.fromDocument(postDoc as unknown as CharaAnalysisDocument);

      // Checks if the content is unchanged
      expect(post.seqId).toBe(1);
      expect(post.language).toBe('cht');
      expect(post.title).toBe('name');
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

    it('blocks publishing duplicated analysis and the content is unchanged', async () => {
      await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 1});
      await expect(
        AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 1, title: 'duplicated'}),
      )
        .rejects
        .toThrow(MongoError);

      const postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: 1,
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

      // Checks if the content is unchanged
      expect(post.seqId).toBe(1);
      expect(post.language).toBe('cht');
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
      await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: 'en'});
      await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: 'cht'});
      await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: 'jp'});

      let postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'en',
      });
      let post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
      expect(post.seqId).toBe(1);
      postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'cht',
      });
      post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
      expect(post.seqId).toBe(2);
      postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'jp',
      });
      post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
      expect(post.seqId).toBe(3);
    });

    it('publishes posts in different languages and IDs', async () => {
      await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 1, lang: 'en'});
      await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 2, lang: 'cht'});
      await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, seqId: 3, lang: 'jp'});

      let postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'en',
      });
      let post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
      expect(post.seqId).toBe(1);
      postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'cht',
      });
      post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
      expect(post.seqId).toBe(2);
      postDoc = await DragonAnalysis.getCollection(app.mongoClient).findOne({
        [MultiLingualDocumentKey.language]: 'jp',
      });
      post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
      expect(post.seqId).toBe(3);
    });

    it('edits', async () => {
      const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

      const editResult = await AnalysisController.editDragonAnalysis(
        app.mongoClient,
        {...payloadDragon, videos: 'videoEdit', seqId: newSeqId, modifyNote: 'mod'},
      );

      expect(editResult).toBe('UPDATED');

      const postDoc = await CharaAnalysis.getCollection(app.mongoClient).findOne({
        [SequentialDocumentKey.sequenceId]: newSeqId,
        [MultiLingualDocumentKey.language]: 'cht',
      });
      const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

      expect(post.videos).toBe('videoEdit');
    });

    it('edits even if no changes were made', async () => {
      const newSeqId = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

      const editResult = await AnalysisController.editDragonAnalysis(
        app.mongoClient,
        {...payloadDragon, seqId: newSeqId, modifyNote: 'mod'},
      );

      expect(editResult).toBe('NO_CHANGE');
    });

    it('returns `NOT_FOUND` if the post to be edited is not found', async () => {
      await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

      const editResult = await AnalysisController.editDragonAnalysis(
        app.mongoClient,
        {...payloadDragon, videos: 'videoEdit', seqId: 8, modifyNote: 'mod'},
      );

      expect(editResult).toBe('NOT_FOUND');
    });
  });
});
