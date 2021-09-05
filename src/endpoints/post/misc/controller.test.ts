import {MongoError} from 'mongodb';

import {MiscPostPublishPayload, SupportedLanguages} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {SeqIdSkippingError} from '../error';
import {MiscPostController} from './controller';
import {MiscPost, MiscPostDocument} from './model';


describe('Misc post controller', () => {
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

  const payload: MiscPostPublishPayload = {
    uid: 'uid',
    lang: SupportedLanguages.CHT,
    title: 'post',
    sections: [
      {
        title: 'A',
        content: 'A1',
      },
      {
        title: 'B',
        content: 'B1',
      },
    ],
  };

  const payload2: MiscPostPublishPayload = {
    uid: 'uid',
    lang: SupportedLanguages.EN,
    title: 'post-en',
    sections: [
      {
        title: 'A-EN',
        content: 'A1-EN',
      },
      {
        title: 'B-EN',
        content: 'B1-EN',
      },
    ],
  };

  it('increments `nextSeqId` per request', async () => {
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {})).toBe(1);
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {})).toBe(2);
  });

  it('increments `nextSeqId` after request', async () => {
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {})).toBe(1);
  });

  it('does not increment `nextSeqId` if specified', async () => {
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
  });

  test('if `nextSeqId` is working as expected', async () => {
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(0);
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {increase: true})).toBe(1);
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {increase: false})).toBe(1);
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {increase: true})).toBe(2);
    expect(await MiscPostController.getNextSeqId(app.mongoClient, {increase: true})).toBe(3);
  });

  it('publishes', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    expect(newSeqId).toBe(1);

    const postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);

    expect(post.seqId).toBe(1);
    expect(post.lang).toBe(SupportedLanguages.CHT);
    expect(post.title).toBe('post');
    expect(post.sections.map((info) => info.toObject())).toStrictEqual([
      {t: 'A', c: 'A1'},
      {t: 'B', c: 'B1'},
    ]);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.datePublishedEpoch).toEqual(expect.any(Number));
    expect(post.dateModifiedEpoch).toEqual(expect.any(Number));
  });

  it('publishes a new post in an used ID but different language', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    expect(newSeqId).toBe(1);

    await MiscPostController.publishPost(app.mongoClient, {...payload2, seqId: newSeqId});

    const postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    const post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);

    expect(post.seqId).toBe(1);
    expect(post.lang).toBe(SupportedLanguages.EN);
    expect(post.title).toBe('post-en');
    expect(post.sections.map((info) => info.toObject())).toStrictEqual([
      {t: 'A-EN', c: 'A1-EN'},
      {t: 'B-EN', c: 'B1-EN'},
    ]);
  });

  it('blocks publishing duplicated post and the content should not change', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1});
    await expect(
      MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, title: 'duplicated'}),
    )
      .rejects
      .toThrow(MongoError);

    const postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);

    // Checks if the content is unchanged
    expect(post.seqId).toBe(1);
    expect(post.lang).toBe(SupportedLanguages.CHT);
    expect(post.title).toBe('post');
    expect(post.sections.map((info) => info.toObject())).toStrictEqual([
      {t: 'A', c: 'A1'},
      {t: 'B', c: 'B1'},
    ]);
  });

  it('blocks publishing ID-skipping post', async () => {
    await expect(
      MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 7}),
    )
      .rejects
      .toThrow(SeqIdSkippingError);
  });

  it('assigns different ID for posts in different language', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.EN});
    await MiscPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.CHT});
    await MiscPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.JP});

    let postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);
    expect(post.seqId).toBe(1);
    postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);
    expect(post.seqId).toBe(2);
    postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);
    expect(post.seqId).toBe(3);
  });

  it('publishes posts in different languages and IDs', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 2, lang: SupportedLanguages.CHT});
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 3, lang: SupportedLanguages.JP});

    let postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);
    expect(post.seqId).toBe(1);
    postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);
    expect(post.seqId).toBe(2);
    postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);
    expect(post.seqId).toBe(3);
  });

  it('returns a list correctly-sorted posts', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await MiscPostController.getPostList(app.mongoClient, SupportedLanguages.CHT, 0, 25);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns a list correctly-sorted posts even if paginated', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await MiscPostController.getPostList(app.mongoClient, SupportedLanguages.CHT, 2, 2);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([5, 4]);
  });

  it('returns without any error if no posts available yet', async () => {
    const postListResult = await MiscPostController.getPostList(app.mongoClient, SupportedLanguages.CHT, 2, 2);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns without any error if no posts matching the language criteria', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await MiscPostController.getPostList(app.mongoClient, SupportedLanguages.EN, 0, 25);

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns correct post count', async () => {
    for (let i = 0; i < 7; i++) {
      await MiscPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await MiscPostController.getPostList(app.mongoClient, SupportedLanguages.CHT, 0, 25);

    expect(postListResult.totalAvailableCount).toBe(7);
  });

  it('returns correct post count after pagination', async () => {
    for (let i = 0; i < 30; i++) {
      await MiscPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await MiscPostController.getPostList(app.mongoClient, SupportedLanguages.CHT, 0, 25);

    expect(postListResult.totalAvailableCount).toBe(30);
  });

  it('increases the view count of a post after getting it', async () => {
    await MiscPostController.publishPost(app.mongoClient, payload);

    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);
    const getResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(4);
  });

  it('does not increase the view count of a post if specified', async () => {
    await MiscPostController.publishPost(app.mongoClient, payload);

    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT, false);
    const getResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
  });

  it('returns the post in an alternative language if main is not available', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.EN});

    const getResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[SequentialDocumentKey.sequenceId]).toBe(1);
  });

  it('returns an empty response if the post does not exist', async () => {
    const getResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult).toBeNull();
  });

  it('returns all available languages of a post', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.JP});

    const postListResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([SupportedLanguages.EN, SupportedLanguages.JP]);
  });

  it('does not check for the available languages if view count does not increase', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.JP});

    const postListResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT, false);

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([]);
  });

  test('if view count behaves correctly according to the specified `incCount`', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await MiscPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.JP});

    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.EN);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.EN);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT, false);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.JP);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.JP);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.JP, false);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.JP, false);

    let getResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.EN, false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
    getResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT, false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(1);
    getResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.JP, false);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  test('if view count behaves correctly when returning the alternative version', async () => {
    await MiscPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.EN});

    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);
    await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);
    const getResult = await MiscPostController.getMiscPost(app.mongoClient, 1, SupportedLanguages.CHT);

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  it('edits a post', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    const editResult = await MiscPostController.editMiscPost(
      app.mongoClient,
      {...payload, title: 'TT', seqId: newSeqId, editNote: 'mod'},
    );

    expect(editResult).toBe('UPDATED');

    const postDoc = await MiscPost.getCollection(app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: newSeqId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = MiscPost.fromDocument(postDoc as unknown as MiscPostDocument);

    expect(post.title).toBe('TT');
    expect(post.editNotes.length).toBe(1);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('edits a post even if no changes were made', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    const editResult = await MiscPostController.editMiscPost(
      app.mongoClient,
      {...payload, seqId: newSeqId, editNote: 'mod'},
    );

    expect(editResult).toBe('NO_CHANGE');
  });

  it('returns `NOT_FOUND` if the post to be edited is not found', async () => {
    await MiscPostController.publishPost(app.mongoClient, payload);

    const editResult = await MiscPostController.editMiscPost(
      app.mongoClient,
      {...payload, title: 'TT', seqId: 8, editNote: 'mod'},
    );

    expect(editResult).toBe('NOT_FOUND');
  });

  it('returns available for the next unused ID in the same language', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    const availability = await MiscPostController.isPostIdAvailable(app.mongoClient, payload.lang, newSeqId + 1);

    expect(availability).toBe(true);
  });

  it('returns available if ID is not given', async () => {
    await MiscPostController.publishPost(app.mongoClient, payload);

    const availability = await MiscPostController.isPostIdAvailable(app.mongoClient, payload.lang);

    expect(availability).toBe(true);
  });

  it('returns available for an unused language in the same ID', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    const availability = await MiscPostController.isPostIdAvailable(app.mongoClient, SupportedLanguages.EN, newSeqId);

    expect(availability).toBe(true);
  });

  it('returns available for an unused language in the next unused ID', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    const availability = await MiscPostController.isPostIdAvailable(
      app.mongoClient,
      SupportedLanguages.EN,
      newSeqId + 1,
    );

    expect(availability).toBe(true);
  });

  it('returns unavailable for a skipping ID', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    const availability = await MiscPostController.isPostIdAvailable(app.mongoClient, payload.lang, newSeqId + 2);

    expect(availability).toBe(false);
  });

  it('returns unavailable for an existing ID', async () => {
    const newSeqId = await MiscPostController.publishPost(app.mongoClient, payload);

    const availability = await MiscPostController.isPostIdAvailable(app.mongoClient, payload.lang, newSeqId);

    expect(availability).toBe(false);
  });

  it('returns unavailable if ID is negative', async () => {
    await MiscPostController.publishPost(app.mongoClient, payload);

    const availability = await MiscPostController.isPostIdAvailable(app.mongoClient, payload.lang, -8);

    expect(availability).toBe(false);
  });
});
