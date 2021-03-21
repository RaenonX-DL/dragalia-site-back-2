import {MongoError} from 'mongodb';
import {QuestPostPublishPayload} from '../../../api-def/api/post/quest/payload';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {SeqIdSkippingError} from '../error';
import {QuestPostController} from './controller';
import {QuestPost, QuestPostDocument} from './model';

describe(`[Controller] ${QuestPostController.name}`, () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  const payload: QuestPostPublishPayload = {
    googleUid: 'uid',
    lang: 'cht',
    title: 'post',
    general: 'general',
    video: 'video',
    positional: [
      {
        position: 'pos1',
        builds: 'build1',
        rotations: 'rot1',
        tips: 'tip1',
      },
      {
        position: 'pos2',
        builds: 'build2',
        rotations: 'rot2',
        tips: 'tip2',
      },
    ],
    addendum: 'addendum',
  };

  const payload2: QuestPostPublishPayload = {
    googleUid: 'uid',
    lang: 'en',
    title: 'post-en',
    general: 'general-en',
    video: 'video-en',
    positional: [
      {
        position: 'pos1-en',
        builds: 'build1-en',
        rotations: 'rot1-en',
        tips: 'tip1-en',
      },
      {
        position: 'pos2-en',
        builds: 'build2-en',
        rotations: 'rot2-en',
        tips: 'tip2-en',
      },
    ],
    addendum: 'addendum-en',
  };

  it('increments `nextSeqId` per request', async () => {
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {})).toBe(1);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {})).toBe(2);
  });

  it('increments `nextSeqId` after request', async () => {
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {})).toBe(1);
  });

  it('does not increment `nextSeqId` if specified', async () => {
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
  });

  test('if `nextSeqId` is working as expected', async () => {
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {increase: true})).toBe(1);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(1);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {increase: true})).toBe(2);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, {increase: true})).toBe(3);
  });

  it('publishes a new post successfully', async () => {
    const newSeqId = await QuestPostController.publishPost(app.mongoClient, payload);

    expect(newSeqId).toBe(1);

    const postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: 'cht',
    });
    const post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);

    expect(post.seqId).toBe(1);
    expect(post.language).toBe('cht');
    expect(post.title).toBe('post');
    expect(post.generalInfo).toBe('general');
    expect(post.video).toBe('video');
    expect(post.positionInfo.map((info) => info.toObject())).toStrictEqual([
      {p: 'pos1', b: 'build1', r: 'rot1', t: 'tip1'},
      {p: 'pos2', b: 'build2', r: 'rot2', t: 'tip2'},
    ]);
    expect(post.addendum).toBe('addendum');
  });

  it('publishes a new post in the same ID but different language', async () => {
    const newSeqId = await QuestPostController.publishPost(app.mongoClient, payload);

    expect(newSeqId).toBe(1);

    await QuestPostController.publishPost(app.mongoClient, {...payload2, seqId: newSeqId});

    const postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: 'en',
    });
    const post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);

    expect(post.seqId).toBe(1);
    expect(post.language).toBe('en');
    expect(post.title).toBe('post-en');
    expect(post.generalInfo).toBe('general-en');
    expect(post.video).toBe('video-en');
    expect(post.positionInfo.map((info) => info.toObject())).toStrictEqual([
      {p: 'pos1-en', b: 'build1-en', r: 'rot1-en', t: 'tip1-en'},
      {p: 'pos2-en', b: 'build2-en', r: 'rot2-en', t: 'tip2-en'},
    ]);
    expect(post.addendum).toBe('addendum-en');
  });

  it('blocks duplicated post publishing and the content should not change', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1});
    await expect(
      QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, title: 'duplicated'}),
    )
      .rejects
      .toThrow(MongoError);

    const postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: 'cht',
    });
    const post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);

    // Checks if the content is unchanged
    expect(post.seqId).toBe(1);
    expect(post.language).toBe('cht');
    expect(post.title).toBe('post');
    expect(post.generalInfo).toBe('general');
    expect(post.video).toBe('video');
    expect(post.positionInfo.map((info) => info.toObject())).toStrictEqual([
      {p: 'pos1', b: 'build1', r: 'rot1', t: 'tip1'},
      {p: 'pos2', b: 'build2', r: 'rot2', t: 'tip2'},
    ]);
    expect(post.addendum).toBe('addendum');
  });

  it('blocks ID-skipping post publishing', async () => {
    await expect(
      QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 7}),
    )
      .rejects
      .toThrow(SeqIdSkippingError);
  });

  it('assigns different ID for posts in different language', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: 'en'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: 'cht'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: 'jp'});

    let postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: 'en',
    });
    let post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(1);
    postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: 'cht',
    });
    post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(2);
    postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: 'jp',
    });
    post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(3);
  });

  it('publishes posts in different languages and IDs', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'en'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 2, lang: 'cht'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 3, lang: 'jp'});

    let postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: 'en',
    });
    let post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(1);
    postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: 'cht',
    });
    post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(2);
    postDoc = await QuestPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: 'jp',
    });
    post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(3);
  });

  it('returns a list correctly-sorted posts', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList(app.mongoClient, 'cht', 0, 25);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns a list correctly-sorted posts even if paginated', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList(app.mongoClient, 'cht', 2, 2);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([5, 4]);
  });

  it('returns without any error if no posts available yet', async () => {
    const postListResult = await QuestPostController.getPostList(app.mongoClient, 'cht', 2, 2);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns without any error if no posts matching the language criteria', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList(app.mongoClient, 'en', 0, 25);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns correct post count', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList(app.mongoClient, 'cht', 0, 25);

    expect(postListResult.totalAvailableCount).toBe(7);
  });

  it('returns correct post count after pagination', async () => {
    for (let i = 0; i < 30; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList(app.mongoClient, 'cht', 0, 25);

    expect(postListResult.totalAvailableCount).toBe(30);
  });

  it('increases the view count of a post after getting it', async () => {
    await QuestPostController.publishPost(app.mongoClient, payload);

    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');
    const getResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(4);
  });

  it('does not increase the view count of a post if specified', async () => {
    await QuestPostController.publishPost(app.mongoClient, payload);

    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht', false);
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht', false);
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht', false);
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht', false);
    const getResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
  });

  it('returns the post in an alternative language if main is not available', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: 'en'});

    const getResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe('en');
    expect(getResult?.post[SequentialDocumentKey.sequenceId]).toBe(1);
  });

  it('returns an empty response if the post does not exist', async () => {
    const getResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');

    expect(getResult).toBeNull();
  });

  it('returns all available languages of a post', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'en'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'cht'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'jp'});

    const postListResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual(['en', 'jp']);
  });

  it('does not check for the available languages if view count does not increase', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'en'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'cht'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'jp'});

    const postListResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht', false);

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([]);
  });

  test('if view count behaves correctly according to the specified `incCount`', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'en'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'cht'});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: 'jp'});

    await QuestPostController.getQuestPost(app.mongoClient, 1, 'en');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'en');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht', false);
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht', false);
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'jp');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'jp');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'jp', false);
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'jp', false);

    let getResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'en', false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
    getResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht', false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(1);
    getResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'jp', false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  test('if view count behaves correctly when returning the alternative version', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: 'en'});

    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');
    await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');
    const getResult = await QuestPostController.getQuestPost(app.mongoClient, 1, 'cht');

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe('en');
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  it('edits a post', async () => {
    const newSeqId = await QuestPostController.publishPost(app.mongoClient, payload);

    const editResult = await QuestPostController.editQuestPost(
      app.mongoClient,
      {...payload, video: 'videoEdit', seqId: newSeqId, modifyNote: 'mod'},
    );

    expect(editResult).toBe('UPDATED');
  });

  it('edits a post even if no changes were made', async () => {
    const newSeqId = await QuestPostController.publishPost(app.mongoClient, payload);

    const editResult = await QuestPostController.editQuestPost(
      app.mongoClient,
      {...payload, seqId: newSeqId, modifyNote: 'mod'},
    );

    expect(editResult).toBe('NO_CHANGE');
  });

  it('returns `NOT_FOUND` if the post to be edited is not found', async () => {
    await QuestPostController.publishPost(app.mongoClient, payload);

    const editResult = await QuestPostController.editQuestPost(
      app.mongoClient,
      {...payload, video: 'videoEdit', seqId: 8, modifyNote: 'mod'},
    );

    expect(editResult).toBe('NOT_FOUND');
  });
});
