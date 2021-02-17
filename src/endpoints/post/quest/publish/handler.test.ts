import {default as request} from 'supertest';
import {
  ApiEndPoints,
  ApiResponseCode,
  BaseResponse,
  QuestPostPublishPayload,
  QuestPostPublishSuccessResponse,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {GoogleUserController} from '../../../userControl/controller';
import {PostDocumentKey} from '../../base/model';
import {QuestPosition, QuestPost, QuestPostDocument} from '../model';

describe(`[Server] GET ${ApiEndPoints.POST_QUEST_PUBLISH} - post publishing endpoint`, () => {
  let app: Application;

  const uidNormal = '87878787877';
  const uidAdmin = '78787878887';

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await GoogleUserController.userLogin(
      app.mongoClient, uidNormal, 'normal@email.com',
    );
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdmin, 'admin@email.com', true,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  const questPayload1: QuestPostPublishPayload = {
    seqId: 1,
    lang: 'cht',
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
    googleUid: uidNormal,
  };

  const questPayload2: QuestPostPublishPayload = {
    lang: 'cht',
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
    googleUid: uidAdmin,
  };

  const questPayload3: QuestPostPublishPayload = {
    ...questPayload2,
    googleUid: uidNormal,
  };

  const questPayload4: QuestPostPublishPayload = {
    ...questPayload2,
    seqId: 7,
  };

  const questPayload5: QuestPostPublishPayload = {
    ...questPayload2,
    lang: 'en',
  };

  const questPayload6: QuestPostPublishPayload = {
    ...questPayload2,
    title: 'post6',
  };

  const questPayload7: QuestPostPublishPayload = {
    ...questPayload2,
    seqId: 1,
  };

  it('should be able to publish a new quest post', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload2);
    expect(result.status).toBe(200);

    const json: QuestPostPublishSuccessResponse = result.body as QuestPostPublishSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('should be able to publish a new quest post even if a post in different language exists', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload5);
    expect(result.status).toBe(200);

    const json: QuestPostPublishSuccessResponse = result.body as QuestPostPublishSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('should be able to publish a new quest post given a valid unused sequential ID', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_QUEST_PUBLISH)
      .query({...questPayload1, googleUid: uidAdmin});
    expect(result.status).toBe(200);

    const json: QuestPostPublishSuccessResponse = result.body as QuestPostPublishSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('should not be able to publish a quest post because the permission is insufficient', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload3);
    expect(result.status).toBe(200);

    const json: BaseResponse = result.body as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_PUBLISHED_NOT_ADMIN);
    expect(json.success).toBe(false);
  });

  it(
    'should not be able to publish a quest post because the post is new and the sequential ID jumps',
    async () => {
      const result = await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload4);
      expect(result.status).toBe(200);

      const json: BaseResponse = result.body as BaseResponse;
      expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_PUBLISHED_ID_SKIPPED);
      expect(json.success).toBe(false);
    });

  it(
    'should not be able to publish a quest post because the post with the same ID and language exists',
    async () => {
      await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload7);

      const result = await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload7);
      expect(result.status).toBe(200);

      const json: BaseResponse = result.body as BaseResponse;
      expect(json.code).toBe(ApiResponseCode.FAILED_POST_ALREADY_EXISTS);
      expect(json.success).toBe(false);
    });

  it('should publish a new quest post and check if it exists in the database', async () => {
    await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload2);

    const docQuery = await QuestPost.getCollection(await app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: questPayload2.lang,
    });
    const doc = QuestPost.fromDocument(docQuery as QuestPostDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.seqId).toEqual(1);
    expect(doc.language).toEqual(questPayload2.lang);
    expect(doc.title).toEqual(questPayload2.title);
    expect(doc.generalInfo).toEqual(questPayload2.general);
    expect(doc.video).toEqual(questPayload2.video);
    expect(doc.positionInfo).toEqual(questPayload2.positional.map(
      (posInfo) => new QuestPosition(posInfo.position, posInfo.builds, posInfo.rotations, posInfo.tips),
    ));
    expect(doc.addendum).toEqual(questPayload2.addendum);
    expect(doc.datePublished.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModified.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.modificationNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });

  it('should send a failed request and check if the existing data has been modified', async () => {
    // Admin & new post
    await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload2);
    // Normal & change title (expect to fail)
    await request(app.express).post(ApiEndPoints.POST_QUEST_PUBLISH).query(questPayload6);

    const docQuery = await QuestPost.getCollection(await app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: questPayload2.lang,
      [PostDocumentKey.title]: questPayload2.title,
    });
    const doc = QuestPost.fromDocument(docQuery as QuestPostDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.seqId).toEqual(1);
    expect(doc.language).toEqual(questPayload2.lang);
    expect(doc.title).toEqual(questPayload2.title);
    expect(doc.generalInfo).toEqual(questPayload2.general);
    expect(doc.video).toEqual(questPayload2.video);
    expect(doc.positionInfo).toEqual(questPayload2.positional.map(
      (posInfo) => new QuestPosition(posInfo.position, posInfo.builds, posInfo.rotations, posInfo.tips),
    ));
    expect(doc.addendum).toEqual(questPayload2.addendum);
    expect(doc.datePublished.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModified.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.modificationNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });
});
