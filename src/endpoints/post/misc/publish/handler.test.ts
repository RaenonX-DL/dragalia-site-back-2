import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  BaseResponse,
  MiscPostPublishPayload,
  MiscPostPublishResponse,
  SupportedLanguages,
} from '../../../../api-def/api';
import {Application, createApp} from '../../../../app';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {PostDocumentKey} from '../../base/model';
import {MiscPost, MiscPostDocument, MiscSection} from '../model';


describe('Misc post publishing EP', () => {
  let app: Application;

  const uidNormal = new ObjectId().toHexString();
  const uidAdmin = new ObjectId().toHexString();

  const miscPayload1: MiscPostPublishPayload = {
    uid: uidNormal,
    lang: SupportedLanguages.CHT,
    title: 'post1',
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

  const miscPayload2: MiscPostPublishPayload = {
    uid: uidAdmin,
    lang: SupportedLanguages.CHT,
    title: 'post2',
    sections: [
      {
        title: 'A2',
        content: 'A21',
      },
      {
        title: 'B2',
        content: 'B21',
      },
    ],
  };

  const miscPayload3: MiscPostPublishPayload = {
    ...miscPayload2,
    uid: uidNormal,
  };

  const miscPayload4: MiscPostPublishPayload = {
    ...miscPayload2,
    seqId: 7,
  };

  const miscPayload5: MiscPostPublishPayload = {
    ...miscPayload2,
    lang: SupportedLanguages.EN,
  };

  const miscPayload6: MiscPostPublishPayload = {
    ...miscPayload2,
    title: 'post6',
  };

  const miscPayload7: MiscPostPublishPayload = {
    ...miscPayload2,
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
    const result = await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload2);
    expect(result.statusCode).toBe(200);

    const json: MiscPostPublishResponse = result.json() as MiscPostPublishResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('publishes a new quest post given an alternative language', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload5);
    expect(result.statusCode).toBe(200);

    const json: MiscPostPublishResponse = result.json() as MiscPostPublishResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('publishes a new quest post given a valid unused sequential ID', async () => {
    const result = await app.app.inject()
      .post(ApiEndPoints.POST_MISC_PUBLISH)
      .payload({...miscPayload1, uid: uidAdmin});
    expect(result.statusCode).toBe(200);

    const json: MiscPostPublishResponse = result.json() as MiscPostPublishResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.seqId).toBe(1);
  });

  it('blocks publishing a quest post with insufficient permission', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload3);
    expect(result.statusCode).toBe(403);

    const json: BaseResponse = result.json() as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });

  it('blocks publishing a quest post with skipping sequential ID', async () => {
    const result = await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload4);
    expect(result.statusCode).toBe(200);

    const json: BaseResponse = result.json() as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_NOT_PUBLISHED_ID_SKIPPED);
    expect(json.success).toBe(false);
  });

  it('blocks publishing a quest post with duplicated ID and language', async () => {
    await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload7);

    const result = await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload7);
    expect(result.statusCode).toBe(200);

    const json: BaseResponse = result.json() as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_POST_ALREADY_EXISTS);
    expect(json.success).toBe(false);
  });

  test('if the published quest post exists in the database', async () => {
    await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload2);

    const docQuery = await MiscPost.getCollection(await app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: miscPayload2.lang,
    });
    const doc = MiscPost.fromDocument(docQuery as MiscPostDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.seqId).toEqual(1);
    expect(doc.lang).toEqual(miscPayload2.lang);
    expect(doc.title).toEqual(miscPayload2.title);
    expect(doc.sections).toEqual(miscPayload2.sections.map(
      (section) => new MiscSection(section.title, section.content),
    ));
    expect(doc.datePublishedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModifiedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.editNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });

  test('if the data is unchanged after a failed request', async () => {
    // Admin & new post
    await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload2);
    // Normal & change title (expect to fail)
    await app.app.inject().post(ApiEndPoints.POST_MISC_PUBLISH).payload(miscPayload6);

    const docQuery = await MiscPost.getCollection(await app.mongoClient).findOne({
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: miscPayload2.lang,
      [PostDocumentKey.title]: miscPayload2.title,
    });
    const doc = MiscPost.fromDocument(docQuery as MiscPostDocument);
    expect(doc).not.toBeFalsy();
    expect(doc.seqId).toEqual(1);
    expect(doc.lang).toEqual(miscPayload2.lang);
    expect(doc.title).toEqual(miscPayload2.title);
    expect(doc.sections).toEqual(miscPayload2.sections.map(
      (section) => new MiscSection(section.title, section.content),
    ));
    expect(doc.datePublishedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.dateModifiedEpoch.valueOf() - Date.now()).toBeLessThanOrEqual(1000);
    expect(doc.editNotes).toHaveLength(0);
    expect(doc.viewCount).toEqual(0);
  });
});
