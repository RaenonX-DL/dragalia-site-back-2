import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  MiscPostEditPayload,
  MiscPostEditResponse,
  MiscPostPublishPayload,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {MiscPostController} from '../controller';


describe('Misc post editing EP', () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const payloadPost: MiscPostPublishPayload = {
    uid: uidAdmin,
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
    sendUpdateEmail: true,
  };

  const payloadEdit: MiscPostEditPayload = {
    ...payloadPost,
    seqId: 1,
    title: 'edit',
    sections: [
      {
        title: 'C',
        content: 'C1',
      },
    ],
    editNote: 'mod',
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidNormal)});
    await insertMockUser(app.mongoClient, {id: new ObjectId(uidAdmin), isAdmin: true});
    await MiscPostController.publishPost(app.mongoClient, payloadPost);
  });

  afterAll(async () => {
    await app.close();
  });

  it('edits a post', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_MISC_EDIT).payload(payloadEdit);
    expect(result.statusCode).toBe(200);

    const json: MiscPostEditResponse = result.json() as MiscPostEditResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('returns success even if no change', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_MISC_EDIT)
      .payload({...payloadPost, seqId: 1, editNote: 'a'});
    expect(result.statusCode).toBe(200);

    const json: MiscPostEditResponse = result.json() as MiscPostEditResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('fails if ID is not given', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_MISC_EDIT)
      .payload({...payloadEdit, seqId: undefined});
    expect(result.statusCode).toBe(400);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED);
    expect(json.success).toBe(false);
  });

  it('fails for non-existing post ID & language', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_MISC_EDIT)
      .payload({...payloadEdit, seqId: 8});
    expect(result.statusCode).toBe(404);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('fails for non-existing post language', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_MISC_EDIT)
      .payload({...payloadEdit, lang: SupportedLanguages.JP});
    expect(result.statusCode).toBe(404);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('fails when permission insufficient', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_MISC_EDIT)
      .payload({...payloadEdit, uid: uidNormal});
    expect(result.statusCode).toBe(403);

    const json: FailedResponse = result.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });
});
