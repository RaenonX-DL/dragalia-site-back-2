import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  BaseResponse,
  QuestPostPublishPayload,
  QuestPostPublishResponse,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {PostDocumentKey} from '../../base/model';
import {QuestPosition, QuestPost, QuestPostDocument} from '../model';


describe(`[Server] POST ${ApiEndPoints.POST_QUEST_PUBLISH} - post publishing endpoint`, () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const questPayload1: QuestPostPublishPayload = {
    uid: uidNormal,
    lang: SupportedLanguages.CHT,
    title: 'post1',
    general: 'gen1',
    video: 'vid1',
    positional: [
      {
        position: '1pos1',
        builds: '1build1',
        rotations: '1rot1',
        tips: '1tip1',
      },
      {
        position: '1pos2',
        builds: '1build2',
        rotations: '1rot2',
        tips: '1tip2',
      },
    ],
    addendum: 'add1',
    sendUpdateEmail: true,
  };

  const questPayload2: QuestPostPublishPayload = {
    uid: uidAdmin,
    lang: SupportedLanguages.CHT,
    title: 'post2',
    general: 'gen2',
    video: 'vid2',
    positional: [
      {
        position: '2pos1',
        builds: '2build1',
        rotations: '2rot1',
        tips: '2tip1',
      },
    ],
    addendum: 'add2',
    sendUpdateEmail: true,
  };

  const questPayload3: QuestPostPublishPayload = {
    ...questPayload2,
    uid: uidNormal,
  };

  const questPayload4: QuestPostPublishPayload = {
    ...questPayload2,
    seqId: 7,
  };

  const questPayload5: QuestPostPublishPayload = {
    ...questPayload2,
    lang: SupportedLanguages.EN,
  };

  const questPayload6: QuestPostPublishPayload = {
    ...questPayload2,
    title: 'post6',
  };

  const questPayload7: QuestPostPublishPayload = {
    ...questPayload2,
    seqId: 1,
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes a new quest post', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload2);
    expect(result.statusCode).toBe(200);

    const json: QuestPostPublishResponse = result.json() as QuestPostPublishResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('publishes a new quest post given an alternative language', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload5);
    expect(result.statusCode).toBe(200);

    const json: QuestPostPublishResponse = result.json() as QuestPostPublishResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('publishes a new quest post given a valid unused sequential ID', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_QUEST_PUBLISH)
      .payload({...questPayload1, uid: uidAdmin});
    expect(result.statusCode).toBe(200);

    const json: QuestPostPublishResponse = result.json() as QuestPostPublishResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('blocks publishing a quest post with insufficient permission', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload3);
    expect(result.statusCode).toBe(403);

    const json: BaseResponse = result.json() as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });

  it(
    'blocks publishing a quest post with skipping sequential ID',
    async () => {
      const result = await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload4);
      expect(result.statusCode).toBe(200);

      const json: BaseResponse = result.json() as BaseResponse;
      expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_PUBLISHED_ID_SKIPPED);
      expect(json.success).toBe(false);
    });

  it(
    'blocks publishing a quest post with duplicated ID and language',
    async () => {
      await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload7);

      const result = await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload7);
      expect(result.statusCode).toBe(200);

      const json: BaseResponse = result.json() as BaseResponse;
      expect(json.code).toBe(ApiResponseCode.FAILED_POST_ALREADY_EXISTS);
      expect(json.success).toBe(false);
    });

  test('if the published quest post exists in the database', async () => {
    await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload2);

    const docQuery = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: questPayload2.lang,
    });
    const doc = QuestPost.fromDocument(docQuery as QuestPostDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.seqId).toEqual(1);
    expect(doc.lang).toEqual(questPayload2.lang);
    expect(doc.title).toEqual(questPayload2.title);
    expect(doc.generalInfo).toEqual(questPayload2.general);
    expect(doc.video).toEqual(questPayload2.video);
    expect(doc.positionInfo).toEqual(questPayload2.positional.map(
      (posInfo) => new QuestPosition(posInfo.position, posInfo.builds, posInfo.rotations, posInfo.tips),
    ));
    expect(doc.addendum).toEqual(questPayload2.addendum);
    expect(doc.datePublishedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModifiedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.editNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });

  test('if the data is unchanged after a failed request', async () => {
    // Admin & new post
    await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload2);
    // Normal & change title (expect to fail)
    await app.app.inject().post(ApiEndPoints.POST_QUEST_PUBLISH).payload(questPayload6);

    const docQuery = await (await QuestPost.getCollection(app.mongoClient)).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: questPayload2.lang,
      [PostDocumentKey.title]: questPayload2.title,
    });
    const doc = QuestPost.fromDocument(docQuery as QuestPostDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.seqId).toEqual(1);
    expect(doc.lang).toEqual(questPayload2.lang);
    expect(doc.title).toEqual(questPayload2.title);
    expect(doc.generalInfo).toEqual(questPayload2.general);
    expect(doc.video).toEqual(questPayload2.video);
    expect(doc.positionInfo).toEqual(questPayload2.positional.map(
      (posInfo) => new QuestPosition(posInfo.position, posInfo.builds, posInfo.rotations, posInfo.tips),
    ));
    expect(doc.addendum).toEqual(questPayload2.addendum);
    expect(doc.datePublishedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModifiedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.editNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });
});
