import {MongoError, ObjectId} from 'mongodb';

import {PostType, QuestPostPublishPayload, SupportedLanguages} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {SubscriptionRecord, SubscriptionRecordDocumentKey} from '../../../thirdparty/mail/data/subscription/model';
import * as sendEmailEdited from '../../../thirdparty/mail/send/post/edited';
import * as sendEmailPublished from '../../../thirdparty/mail/send/post/published';
import {GetSequentialPostOptions} from '../base/controller/type';
import {SeqIdSkippingError} from '../error';
import {QuestPostController} from './controller';
import {QuestPost, QuestPostDocument} from './model';


describe('Quest post controller', () => {
  let app: Application;

  let getPostOpts: GetSequentialPostOptions;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    getPostOpts = {
      mongoClient: app.mongoClient,
      uid: '',
      seqId: 1,
      lang: SupportedLanguages.CHT,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  const payload: QuestPostPublishPayload = {
    uid: 'uid',
    lang: SupportedLanguages.CHT,
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
    uid: 'uid',
    lang: SupportedLanguages.EN,
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

  it('publishes', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    expect(seqId).toBe(1);

    const postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);

    expect(post.seqId).toBe(1);
    expect(post.lang).toBe(SupportedLanguages.CHT);
    expect(post.title).toBe('post');
    expect(post.generalInfo).toBe('general');
    expect(post.video).toBe('video');
    expect(post.positionInfo.map((info) => info.toObject())).toStrictEqual([
      {p: 'pos1', b: 'build1', r: 'rot1', t: 'tip1'},
      {p: 'pos2', b: 'build2', r: 'rot2', t: 'tip2'},
    ]);
    expect(post.addendum).toBe('addendum');
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.datePublishedEpoch).toEqual(expect.any(Number));
    expect(post.dateModifiedEpoch).toEqual(expect.any(Number));
  });

  it('publishes a new post in an used ID but different language', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    expect(seqId).toBe(1);

    await QuestPostController.publishPost(app.mongoClient, {...payload2, seqId});

    const postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    const post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);

    expect(post.seqId).toBe(1);
    expect(post.lang).toBe(SupportedLanguages.EN);
    expect(post.title).toBe('post-en');
    expect(post.generalInfo).toBe('general-en');
    expect(post.video).toBe('video-en');
    expect(post.positionInfo.map((info) => info.toObject())).toStrictEqual([
      {p: 'pos1-en', b: 'build1-en', r: 'rot1-en', t: 'tip1-en'},
      {p: 'pos2-en', b: 'build2-en', r: 'rot2-en', t: 'tip2-en'},
    ]);
    expect(post.addendum).toBe('addendum-en');
  });

  it('blocks publishing duplicated post and the content should not change', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1});
    await expect(
      QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, title: 'duplicated'}),
    )
      .rejects
      .toThrow(MongoError);

    const postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);

    // Checks if the content is unchanged
    expect(post.seqId).toBe(1);
    expect(post.lang).toBe(SupportedLanguages.CHT);
    expect(post.title).toBe('post');
    expect(post.generalInfo).toBe('general');
    expect(post.video).toBe('video');
    expect(post.positionInfo.map((info) => info.toObject())).toStrictEqual([
      {p: 'pos1', b: 'build1', r: 'rot1', t: 'tip1'},
      {p: 'pos2', b: 'build2', r: 'rot2', t: 'tip2'},
    ]);
    expect(post.addendum).toBe('addendum');
  });

  it('blocks publishing ID-skipping post', async () => {
    await expect(
      QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 7}),
    )
      .rejects
      .toThrow(SeqIdSkippingError);
  });

  it('assigns ID for posts in different language automatically', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.EN});
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.JP});

    let postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(1);
    postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(1);
    postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(1);
  });

  it('publishes posts with correct manually assigned IDs', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.JP});

    let postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(1);
    postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(1);
    postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);
    expect(post.seqId).toBe(1);
  });

  it('returns correctly sorted post list', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList({
      mongoClient: app.mongoClient,
      uid: '',
      lang: SupportedLanguages.CHT,
    });

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('returns limited results', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList({
      mongoClient: app.mongoClient,
      uid: '',
      lang: SupportedLanguages.CHT,
      limit: 3,
    });

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([7, 6, 5]);
  });

  it('returns without any error if no posts available yet', async () => {
    const postListResult = await QuestPostController.getPostList({
      mongoClient: app.mongoClient,
      uid: '',
      lang: SupportedLanguages.CHT,
    });

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns without any error if no posts matching the language criteria', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList({
      mongoClient: app.mongoClient,
      uid: '',
      lang: SupportedLanguages.EN,
    });

    expect(postListResult.postListEntries.map((entry) => entry.seqId)).toStrictEqual([]);
  });

  it('returns correct subscription status if user ID is empty', async () => {
    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }

    const postListResult = await QuestPostController.getPostList({
      mongoClient: app.mongoClient,
      uid: '',
      lang: SupportedLanguages.EN,
    });

    expect(postListResult.postListEntries.every((entry) => !entry.userSubscribed)).toBeTruthy();
  });

  it('returns correct subscription status if the user has global subscription', async () => {
    const uid = new ObjectId();

    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }
    await (await SubscriptionRecord.getCollection(app.mongoClient)).insertOne({
      [SubscriptionRecordDocumentKey.key]: {type: 'const', name: 'ALL_QUEST'},
      [SubscriptionRecordDocumentKey.uid]: uid,
    });

    const postListResult = await QuestPostController.getPostList({
      mongoClient: app.mongoClient,
      uid: '',
      lang: SupportedLanguages.EN,
    });

    expect(postListResult.postListEntries.every((entry) => entry.userSubscribed)).toBeTruthy();
  });

  it('returns correct subscription status if the user has specific subscription', async () => {
    const uid = new ObjectId();

    for (let i = 0; i < 7; i++) {
      await QuestPostController.publishPost(app.mongoClient, payload);
    }
    await (await SubscriptionRecord.getCollection(app.mongoClient)).insertOne({
      [SubscriptionRecordDocumentKey.key]: {type: 'post', postType: PostType.QUEST, id: 6},
      [SubscriptionRecordDocumentKey.uid]: uid,
    });

    const postListResult = await QuestPostController.getPostList({
      mongoClient: app.mongoClient,
      uid: '',
      lang: SupportedLanguages.EN,
    });

    expect(postListResult.postListEntries.every((entry) => entry.seqId !== 6 && !entry.userSubscribed)).toBeTruthy();
    expect(postListResult.postListEntries.every((entry) => entry.seqId === 6 && entry.userSubscribed)).toBeTruthy();
  });

  it('increases the view count of a post after getting it', async () => {
    await QuestPostController.publishPost(app.mongoClient, payload);

    await QuestPostController.getQuestPost(getPostOpts);
    await QuestPostController.getQuestPost(getPostOpts);
    await QuestPostController.getQuestPost(getPostOpts);
    await QuestPostController.getQuestPost(getPostOpts);
    const getResult = await QuestPostController.getQuestPost(getPostOpts);

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(4);
  });

  it('does not increase the view count of a post if specified', async () => {
    await QuestPostController.publishPost(app.mongoClient, payload);

    await QuestPostController.getQuestPost({...getPostOpts, incCount: false});
    await QuestPostController.getQuestPost({...getPostOpts, incCount: false});
    await QuestPostController.getQuestPost({...getPostOpts, incCount: false});
    await QuestPostController.getQuestPost({...getPostOpts, incCount: false});
    const getResult = await QuestPostController.getQuestPost(getPostOpts);

    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(0);
  });

  it('returns the post in an alternative language if main is not available', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.EN});

    const getResult = await QuestPostController.getQuestPost(getPostOpts);

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[SequentialDocumentKey.sequenceId]).toBe(1);
  });

  it('returns an empty response if the post does not exist', async () => {
    const getResult = await QuestPostController.getQuestPost(getPostOpts);

    expect(getResult).toBeNull();
  });

  it('returns all available languages of a post', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.JP});

    const postListResult = await QuestPostController.getQuestPost(getPostOpts);

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([SupportedLanguages.EN, SupportedLanguages.JP]);
  });

  it('does not check for the available languages if view count does not increase', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.JP});

    const postListResult = await QuestPostController.getQuestPost({...getPostOpts, incCount: false});

    expect(postListResult?.isAltLang).toBe(false);
    expect(postListResult?.otherLangs).toStrictEqual([]);
  });

  test('if view count behaves correctly according to the specified `incCount`', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.JP});

    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.EN});
    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.EN});
    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.CHT});
    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.CHT, incCount: false});
    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.CHT, incCount: false});
    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.JP});
    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.JP});
    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.JP, incCount: false});
    await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.JP, incCount: false});

    let getResult = await QuestPostController.getQuestPost({
      ...getPostOpts, lang: SupportedLanguages.EN, incCount: false,
    });
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
    getResult = await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.CHT, incCount: false});
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(1);
    getResult = await QuestPostController.getQuestPost({...getPostOpts, lang: SupportedLanguages.JP, incCount: false});
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  test('if view count behaves correctly when returning the alternative version', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, lang: SupportedLanguages.EN});

    await QuestPostController.getQuestPost(getPostOpts);
    await QuestPostController.getQuestPost(getPostOpts);
    const getResult = await QuestPostController.getQuestPost(getPostOpts);

    expect(getResult?.isAltLang).toBe(true);
    expect(getResult?.post[MultiLingualDocumentKey.language]).toBe(SupportedLanguages.EN);
    expect(getResult?.post[ViewCountableDocumentKey.viewCount]).toBe(2);
  });

  it('edits a post', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    const {updated} = await QuestPostController.editQuestPost(
      app.mongoClient,
      {...payload, video: 'videoEdit', seqId, editNote: 'mod'},
    );

    expect(updated).toBe('UPDATED');

    const postDoc = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [SequentialDocumentKey.sequenceId]: seqId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = QuestPost.fromDocument(postDoc as unknown as QuestPostDocument);

    expect(post.video).toBe('videoEdit');
    expect(post.editNotes.length).toBe(1);
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('edits a post even if no changes were made', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    const {updated} = await QuestPostController.editQuestPost(
      app.mongoClient,
      {...payload, seqId, editNote: 'mod'},
    );

    expect(updated).toBe('NO_CHANGE');
  });

  it('returns `NOT_FOUND` if the post to be edited is not found', async () => {
    await QuestPostController.publishPost(app.mongoClient, payload);

    const {updated} = await QuestPostController.editQuestPost(
      app.mongoClient,
      {...payload, video: 'videoEdit', seqId: 8, editNote: 'mod'},
    );

    expect(updated).toBe('NOT_FOUND');
  });

  it('returns available for the next unused ID in the same language', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    const availability = await QuestPostController.isPostIdAvailable(app.mongoClient, payload.lang, seqId + 1);

    expect(availability).toBe(true);
  });

  it('returns available if ID is not given', async () => {
    await QuestPostController.publishPost(app.mongoClient, payload);

    const availability = await QuestPostController.isPostIdAvailable(app.mongoClient, payload.lang);

    expect(availability).toBe(true);
  });

  it('returns available for an unused language in the same ID', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    const availability = await QuestPostController.isPostIdAvailable(app.mongoClient, SupportedLanguages.EN, seqId);

    expect(availability).toBe(true);
  });

  it('returns available for an unused language in the next unused ID', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    const availability = await QuestPostController.isPostIdAvailable(
      app.mongoClient,
      SupportedLanguages.EN,
      seqId + 1,
    );

    expect(availability).toBe(false);
  });

  it('returns unavailable for a skipping ID', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    const availability = await QuestPostController.isPostIdAvailable(app.mongoClient, payload.lang, seqId + 2);

    expect(availability).toBe(false);
  });

  it('returns unavailable for an existing ID', async () => {
    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    const availability = await QuestPostController.isPostIdAvailable(app.mongoClient, payload.lang, seqId);

    expect(availability).toBe(false);
  });

  it('returns unavailable if ID is negative', async () => {
    await QuestPostController.publishPost(app.mongoClient, payload);

    const availability = await QuestPostController.isPostIdAvailable(app.mongoClient, payload.lang, -8);

    expect(availability).toBe(false);
  });

  it('returns correct ID check result across languages', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 2, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});

    const available = await QuestPostController.isPostIdAvailable(app.mongoClient, SupportedLanguages.CHT, 3);

    expect(available).toBeTruthy();
  });

  it('publishes in correct ID order', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 2, lang: SupportedLanguages.CHT});
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, lang: SupportedLanguages.EN});

    const {seqId} = await QuestPostController.publishPost(
      app.mongoClient, {...payload, lang: SupportedLanguages.CHT},
    );

    expect(seqId).toBe(3);
  });

  it('sends an email on published', async () => {
    const fnSendPostPublishedEmail = jest.spyOn(sendEmailPublished, 'sendMailPostPublished')
      .mockResolvedValue({accepted: [], rejected: []});

    await QuestPostController.publishPost(app.mongoClient, payload);

    expect(fnSendPostPublishedEmail).toHaveBeenCalledTimes(1);
  });

  it('sends an email on edited', async () => {
    const fnSendPostEditedEmail = jest.spyOn(sendEmailEdited, 'sendMailPostEdited')
      .mockResolvedValue({accepted: [], rejected: []});

    const {seqId} = await QuestPostController.publishPost(app.mongoClient, payload);

    await QuestPostController.editQuestPost(
      app.mongoClient,
      {...payload, title: 'TT', seqId, editNote: 'mod'},
    );

    expect(fnSendPostEditedEmail).toHaveBeenCalledTimes(1);
  });
});
