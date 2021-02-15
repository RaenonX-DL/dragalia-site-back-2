import {MongoError} from 'mongodb';
import {QuestPostPublishPayload} from '../../../api-def/api/post/quest/payload';
import {Application, createApp} from '../../../app';
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

  it('checks if `nextSeqId` increments per request', async () => {
    expect(await QuestPostController.getNextSeqId(app.mongoClient)).toBe(1);
    expect(await QuestPostController.getNextSeqId(app.mongoClient)).toBe(2);
  });

  it('checks if `nextSeqId` increments after request', async () => {
    expect(await QuestPostController.getNextSeqId(app.mongoClient)).toBe(1);
  });

  it('checks if `nextSeqId` does not increment if specified', async () => {
    expect(await QuestPostController.getNextSeqId(app.mongoClient, false)).toBe(0);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, false)).toBe(0);
  });

  it('checks if `nextSeqId` working as expected', async () => {
    expect(await QuestPostController.getNextSeqId(app.mongoClient, false)).toBe(0);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, false)).toBe(0);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, true)).toBe(1);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, false)).toBe(1);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, true)).toBe(2);
    expect(await QuestPostController.getNextSeqId(app.mongoClient, true)).toBe(3);
  });

  it('checks if a new post can be successfully stored', async () => {
    const newSeqId = await QuestPostController.publishPost(app.mongoClient, payload);

    expect(newSeqId).toBe(1);

    const postDoc = await QuestPost.getCollection(app.mongoClient).findOne({_seq: 1, _lang: 'cht'});
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

  it('checks if a new post with same ID but different language can be published', async () => {
    const newSeqId = await QuestPostController.publishPost(app.mongoClient, payload);

    expect(newSeqId).toBe(1);

    await QuestPostController.publishPost(app.mongoClient, {...payload2, seqId: newSeqId});

    const postDoc = await QuestPost.getCollection(app.mongoClient).findOne({_seq: 1, _lang: 'en'});
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

  it('checks if a duplicated post publish is blocked and the content is not changed', async () => {
    await QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1});
    await expect(
      QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 1, title: 'duplicated'}),
    )
      .rejects
      .toThrow(MongoError);

    const postDoc = await QuestPost.getCollection(app.mongoClient).findOne({_seq: 1, _lang: 'cht'});
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

  it('checks if a ID-skipping post publish is blocked', async () => {
    await expect(
      QuestPostController.publishPost(app.mongoClient, {...payload, seqId: 7}),
    )
      .rejects
      .toThrow(SeqIdSkippingError);
  });
});
