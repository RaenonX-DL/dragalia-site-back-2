import {MongoError} from 'mongodb';

import {DragonAnalysisPublishPayload, SupportedLanguages, UnitType} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import * as sendEmailEdited from '../../../thirdparty/mail/send/post/edited';
import * as sendEmailPublished from '../../../thirdparty/mail/send/post/published';
import {AnalysisController} from './controller';
import {UnitNotExistsError, UnitTypeMismatchError} from './error';
import {DragonAnalysis, DragonAnalysisDocument} from './model/dragon';
import {UnitAnalysisDocumentKey} from './model/unitAnalysis';


describe('Dragon Analysis Controller', () => {
  let app: Application;

  const payloadDragon: DragonAnalysisPublishPayload = {
    uid: 'uid',
    type: UnitType.DRAGON,
    lang: SupportedLanguages.CHT,
    unitId: 20040405,
    summary: 'dragonSummary',
    summonResult: 'dragonSummon',
    normalAttacks: 'dragonNormal',
    ultimate: 'dragonUltimate',
    passives: 'dragonPassive',
    notes: 'dragonNotes',
    suitableCharacters: 'dragonChara',
    videos: 'dragonVideo',
    sendUpdateEmail: true,
  };

  const fnSendPostPublishedEmail = jest.spyOn(sendEmailPublished, 'sendMailPostPublished')
    .mockResolvedValue({accepted: [], rejected: []});
  const fnSendPostEditedEmail = jest.spyOn(sendEmailEdited, 'sendMailPostEdited')
    .mockResolvedValue({accepted: [], rejected: []});

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();

    fnSendPostPublishedEmail.mockReset();
    fnSendPostEditedEmail.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('publishes', async () => {
    const {unitId} = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    expect(unitId).toBe(payloadDragon.unitId);

    const postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadDragon.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    expect(post.lang).toBe(SupportedLanguages.CHT);
    expect(post.unitId).toBe(payloadDragon.unitId);
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.passives).toBe('dragonPassive');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.datePublishedEpoch).toEqual(expect.any(Number));
    expect(post.dateModifiedEpoch).toEqual(expect.any(Number));
  });

  it('publishes in an used ID but different language', async () => {
    const {unitId} = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    expect(unitId).toBe(payloadDragon.unitId);

    await AnalysisController.publishDragonAnalysis(app.mongoClient, {
      ...payloadDragon,
      unitId: payloadDragon.unitId,
      lang: SupportedLanguages.EN,
      passives: 'passive-en',
    });

    const postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadDragon.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    expect(post.lang).toBe(SupportedLanguages.EN);
    expect(post.unitId).toBe(20040405);
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.passives).toBe('passive-en');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
  });

  it('blocks publishing duplicated analysis and the content is unchanged', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);
    await expect(
      AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, videos: 'v'}),
    )
      .rejects
      .toThrow(MongoError);

    const postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadDragon.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    // Checks if the content is unchanged
    expect(post.lang).toBe(SupportedLanguages.CHT);
    expect(post.unitId).toBe(payloadDragon.unitId);
    expect(post.summary).toBe('dragonSummary');
    expect(post.summonResult).toBe('dragonSummon');
    expect(post.passives).toBe('dragonPassive');
    expect(post.normalAttacks).toBe('dragonNormal');
    expect(post.ultimate).toBe('dragonUltimate');
    expect(post.notes).toBe('dragonNotes');
    expect(post.suitableCharacters).toBe('dragonChara');
    expect(post.videos).toBe('dragonVideo');
  });

  it('blocks publishing analysis with non-existent unit ID', async () => {
    await expect(
      AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, unitId: 7}),
    )
      .rejects
      .toThrow(UnitNotExistsError);
  });

  it('blocks publishing with wrong unit type', async () => {
    await expect(
      AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, unitId: 10950101}),
    )
      .rejects
      .toThrow(UnitTypeMismatchError);
  });

  it('assigns different ID for different language', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: SupportedLanguages.EN});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: SupportedLanguages.CHT});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, lang: SupportedLanguages.JP});

    let postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.unitId).toBe(payloadDragon.unitId);
    postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.unitId).toBe(payloadDragon.unitId);
    postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.unitId).toBe(payloadDragon.unitId);
  });

  it('publishes analyses in different languages and IDs', async () => {
    await AnalysisController.publishDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, unitId: 20030102, lang: SupportedLanguages.EN},
    );
    await AnalysisController.publishDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, unitId: 20030202, lang: SupportedLanguages.CHT},
    );
    await AnalysisController.publishDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, unitId: 20030402, lang: SupportedLanguages.JP},
    );

    let postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.EN,
    });
    let post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.unitId).toBe(20030102);
    postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.unitId).toBe(20030202);
    postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [MultiLingualDocumentKey.language]: SupportedLanguages.JP,
    });
    post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);
    expect(post.unitId).toBe(20030402);
  });

  it('edits', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    const {updated} = await AnalysisController.editDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, videos: 'videoEdit', editNote: 'mod'},
    );

    expect(updated).toBe('UPDATED');

    const postDoc = await (await DragonAnalysis.getCollection(app.mongoClient)).findOne({
      [UnitAnalysisDocumentKey.unitId]: payloadDragon.unitId,
      [MultiLingualDocumentKey.language]: SupportedLanguages.CHT,
    });
    const post = DragonAnalysis.fromDocument(postDoc as unknown as DragonAnalysisDocument);

    expect(post.videos).toBe('videoEdit');
    // Weird syntax on checking the value is number - https://stackoverflow.com/a/56133391/11571888
    expect(post.editNotes[0].timestampEpoch).toEqual(expect.any(Number));
  });

  it('edits even if no changes were made', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    const {updated} = await AnalysisController.editDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, editNote: 'mod'},
    );

    expect(updated).toBe('NO_CHANGE');
  });

  it('returns `NOT_FOUND` if the post to be edited is not found', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    const {updated} = await AnalysisController.editDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, videos: 'videoEdit', unitId: 20030102, editNote: 'mod'},
    );

    expect(updated).toBe('NOT_FOUND');
  });

  it('sends an email on published', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, sendUpdateEmail: true});

    expect(fnSendPostPublishedEmail).toHaveBeenCalledTimes(1);
  });

  it('does not send email on published', async () => {
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, sendUpdateEmail: false});

    expect(fnSendPostPublishedEmail).not.toHaveBeenCalled();
  });

  it('sends an email on edited', async () => {
    const {unitId} = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    await AnalysisController.editDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, unitId, videos: 'videoEdit', editNote: 'mod', sendUpdateEmail: true},
    );

    expect(fnSendPostEditedEmail).toHaveBeenCalledTimes(1);
  });

  it('does not send email on edited', async () => {
    const {unitId} = await AnalysisController.publishDragonAnalysis(app.mongoClient, payloadDragon);

    await AnalysisController.editDragonAnalysis(
      app.mongoClient,
      {...payloadDragon, unitId, videos: 'videoEdit', editNote: 'mod', sendUpdateEmail: false},
    );

    expect(fnSendPostEditedEmail).not.toHaveBeenCalled();
  });
});
