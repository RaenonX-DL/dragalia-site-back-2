import {default as request} from 'supertest';

import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  QuestPostEditPayload,
  QuestPostEditSuccessResponse,
  QuestPostPublishPayload,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {GoogleUserController} from '../../../userControl/controller';
import {GoogleUser, GoogleUserDocumentKey} from '../../../userControl/model';
import {QuestPostController} from '../controller';

describe(`[Server] POST ${ApiEndPoints.POST_QUEST_EDIT} - edit a specific quest post`, () => {
  let app: Application;

  const uidAdmin = '78787878887';
  const uidNormal = '1234567890';
  const uidAdsFree = '789123456';

  const payloadPost: QuestPostPublishPayload = {
    googleUid: uidAdmin,
    seqId: 1,
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

  const payloadEdit: QuestPostEditPayload = {
    ...payloadPost,
    title: 'edit',
    video: 'videoNew',
    positional: [],
    editNote: 'mod',
  };

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
    await GoogleUserController.userLogin(
      app.mongoClient, uidAdsFree, 'adsFree@email.com',
    );
    await GoogleUser.getCollection(app.mongoClient).updateOne(
      {[GoogleUserDocumentKey.userId]: uidAdsFree},
      {$set: {[GoogleUserDocumentKey.adsFreeExpiry]: new Date(new Date().getTime() + 20000)}},
    );
    await QuestPostController.publishPost(app.mongoClient, payloadPost);
  });

  afterAll(async () => {
    await app.close();
  });

  it('edits a post', async () => {
    const result = await request(app.express).post(ApiEndPoints.POST_QUEST_EDIT).send(payloadEdit);
    expect(result.status).toBe(200);

    const json: QuestPostEditSuccessResponse = result.body as QuestPostEditSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('returns success even if no change', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_QUEST_EDIT)
      .send({...payloadPost, editNote: 'a'});
    expect(result.status).toBe(200);

    const json: QuestPostEditSuccessResponse = result.body as QuestPostEditSuccessResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('returns failure if ID is not given', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_QUEST_EDIT)
      .send({...payloadEdit, seqId: undefined});
    expect(result.status).toBe(400);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED);
    expect(json.success).toBe(false);
  });

  it('returns failure for non-existing post ID & language', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_QUEST_EDIT)
      .send({...payloadEdit, seqId: 8});
    expect(result.status).toBe(404);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns failure for non-existing post language', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_QUEST_EDIT)
      .send({...payloadEdit, lang: SupportedLanguages.JP});
    expect(result.status).toBe(404);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns failure when permission insufficient', async () => {
    const result = await request(app.express)
      .post(ApiEndPoints.POST_QUEST_EDIT)
      .send({...payloadEdit, googleUid: uidNormal});
    expect(result.status).toBe(401);

    const json: FailedResponse = result.body as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });
});
