import {ObjectId} from 'mongodb';

import {insertMockUser} from '../../../../../test/data/user';
import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  SupportedLanguages,
  UnitTierNoteUpdateResponse,
} from '../../../../api-def/api';
import {DocumentBaseKey} from '../../../../api-def/models';
import {Application, createApp} from '../../../../app';
import * as utils from '../../../../utils/misc';
import {
  TierNote,
  TierNoteEntryDocumentKey,
  UnitTierNote,
  UnitTierNoteDocument,
  UnitTierNoteDocumentKey,
} from '../model';


describe('Tier note updating handler', () => {
  let app: Application;

  const uidAdmin = new ObjectId();
  const epoch = 100000;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    await insertMockUser(app.mongoClient, {id: uidAdmin, isAdmin: true});

    jest.spyOn(utils, 'getCurrentEpoch').mockReturnValue(epoch);
  });

  afterAll(async () => {
    await app.close();
  });

  it('adds new tier note if not available before', async () => {
    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_NOTE).payload({
      uid: uidAdmin,
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
      data: {
        points: ['idA'],
        tier: {conAi: {ranking: 'S', note: 'A', isCompDependent: true}},
      },
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteUpdateResponse = response.json() as UnitTierNoteUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const doc = await UnitTierNote.getCollection(app.mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: 10950101}) as UnitTierNoteDocument;

    delete doc[DocumentBaseKey.id];

    expect(doc).toStrictEqual({
      [UnitTierNoteDocumentKey.unitId]: 10950101,
      [UnitTierNoteDocumentKey.points]: ['idA'],
      [UnitTierNoteDocumentKey.tier]: {
        conAi: {
          [TierNoteEntryDocumentKey.ranking]: 'S',
          [TierNoteEntryDocumentKey.note]: {[SupportedLanguages.CHT]: 'A'},
          [TierNoteEntryDocumentKey.isCompDependent]: true,
        },
      },
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: epoch,
    });
  });

  it('updates tier note if the given language already have one', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [],
        tier: {
          conAi: new TierNote({
            ranking: 'S', note: {[SupportedLanguages.CHT]: 'A', [SupportedLanguages.EN]: 'B'}, isCompDependent: true,
          }),
        },
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_NOTE).payload({
      uid: uidAdmin,
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
      data: {
        points: ['idA'],
        tier: {conAi: {ranking: 'A', note: 'C', isCompDependent: true}},
      },
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteUpdateResponse = response.json() as UnitTierNoteUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const doc = await UnitTierNote.getCollection(app.mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: 10950101}) as UnitTierNoteDocument;

    delete doc[DocumentBaseKey.id];

    expect(doc).toStrictEqual({
      [UnitTierNoteDocumentKey.unitId]: 10950101,
      [UnitTierNoteDocumentKey.points]: ['idA'],
      [UnitTierNoteDocumentKey.tier]: {
        conAi: {
          [TierNoteEntryDocumentKey.ranking]: 'A',
          [TierNoteEntryDocumentKey.note]: {[SupportedLanguages.CHT]: 'C', [SupportedLanguages.EN]: 'B'},
          [TierNoteEntryDocumentKey.isCompDependent]: true,
        },
      },
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: epoch,
    });
  });

  it('adds new tier note dimension', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [],
        tier: {
          conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.EN]: 'B'}, isCompDependent: true}),
        },
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_NOTE).payload({
      uid: uidAdmin,
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
      data: {
        points: ['idA'],
        tier: {conSolo: {ranking: 'A', note: 'C', isCompDependent: false}},
      },
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteUpdateResponse = response.json() as UnitTierNoteUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const doc = await UnitTierNote.getCollection(app.mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: 10950101}) as UnitTierNoteDocument;

    delete doc[DocumentBaseKey.id];

    expect(doc).toStrictEqual({
      [UnitTierNoteDocumentKey.unitId]: 10950101,
      [UnitTierNoteDocumentKey.points]: ['idA'],
      [UnitTierNoteDocumentKey.tier]: {
        conAi: {
          [TierNoteEntryDocumentKey.ranking]: 'S',
          [TierNoteEntryDocumentKey.note]: {[SupportedLanguages.EN]: 'B'},
          [TierNoteEntryDocumentKey.isCompDependent]: true,
        },
        conSolo: {
          [TierNoteEntryDocumentKey.ranking]: 'A',
          [TierNoteEntryDocumentKey.note]: {[SupportedLanguages.CHT]: 'C'},
          [TierNoteEntryDocumentKey.isCompDependent]: false,
        },
      },
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: epoch,
    });
  });

  it('adds tier note in given language if necessary', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [],
        tier: {
          conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.EN]: 'B'}, isCompDependent: true}),
        },
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_NOTE).payload({
      uid: uidAdmin,
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
      data: {
        points: ['idA'],
        tier: {conAi: {ranking: 'A', note: 'C', isCompDependent: true}},
      },
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteUpdateResponse = response.json() as UnitTierNoteUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const doc = await UnitTierNote.getCollection(app.mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: 10950101}) as UnitTierNoteDocument;

    delete doc[DocumentBaseKey.id];

    expect(doc).toStrictEqual({
      [UnitTierNoteDocumentKey.unitId]: 10950101,
      [UnitTierNoteDocumentKey.points]: ['idA'],
      [UnitTierNoteDocumentKey.tier]: {
        conAi: {
          [TierNoteEntryDocumentKey.ranking]: 'A',
          [TierNoteEntryDocumentKey.note]: {[SupportedLanguages.CHT]: 'C', [SupportedLanguages.EN]: 'B'},
          [TierNoteEntryDocumentKey.isCompDependent]: true,
        },
      },
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: epoch,
    });
  });

  it('removes tier note dimension', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [],
        tier: {
          conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.CHT]: 'B'}, isCompDependent: true}),
          conSolo: new TierNote({ranking: 'A', note: {[SupportedLanguages.CHT]: 'C'}, isCompDependent: true}),
        },
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_NOTE).payload({
      uid: uidAdmin,
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
      data: {
        points: ['idA'],
        tier: {conSolo: {ranking: 'A', note: 'B', isCompDependent: false}},
      },
    });
    expect(response.statusCode).toBe(200);

    const json: UnitTierNoteUpdateResponse = response.json() as UnitTierNoteUpdateResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);

    const doc = await UnitTierNote.getCollection(app.mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: 10950101}) as UnitTierNoteDocument;

    delete doc[DocumentBaseKey.id];

    expect(doc).toStrictEqual({
      [UnitTierNoteDocumentKey.unitId]: 10950101,
      [UnitTierNoteDocumentKey.points]: ['idA'],
      [UnitTierNoteDocumentKey.tier]: {
        conSolo: {
          [TierNoteEntryDocumentKey.ranking]: 'A',
          [TierNoteEntryDocumentKey.note]: {[SupportedLanguages.CHT]: 'B'},
          [TierNoteEntryDocumentKey.isCompDependent]: false,
        },
      },
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: epoch,
    });
  });

  it('does not allow non-admin to update', async () => {
    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_NOTE).payload({
      uid: '',
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
      data: {
        points: ['idA'],
        tier: {conAi: {ranking: 'S', note: 'A', isCompDependent: true}},
      },
    });
    expect(response.statusCode).toBe(403);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
    expect(json.success).toBe(false);
  });

  it('does not change the stored data after 403 request', async () => {
    const dataArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: ['idA'],
        tier: {
          conAi: new TierNote({
            ranking: 'S', note: {[SupportedLanguages.CHT]: 'A', [SupportedLanguages.EN]: 'B'}, isCompDependent: true,
          }),
        },
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

    const response = await app.app.inject().post(ApiEndPoints.MANAGE_TIER_NOTE).payload({
      uid: '',
      lang: SupportedLanguages.CHT,
      unitId: 10950101,
      data: {
        points: [],
        tier: {conAi: {ranking: 'A', note: 'B', isCompDependent: true}},
      },
    });
    expect(response.statusCode).toBe(403);

    const doc = await UnitTierNote.getCollection(app.mongoClient)
      .findOne({[UnitTierNoteDocumentKey.unitId]: 10950101}) as UnitTierNoteDocument;

    delete doc[DocumentBaseKey.id];

    expect(doc).toStrictEqual({
      [UnitTierNoteDocumentKey.unitId]: 10950101,
      [UnitTierNoteDocumentKey.points]: ['idA'],
      [UnitTierNoteDocumentKey.tier]: {
        conAi: {
          [TierNoteEntryDocumentKey.ranking]: 'S',
          [TierNoteEntryDocumentKey.note]: {[SupportedLanguages.CHT]: 'A', [SupportedLanguages.EN]: 'B'},
          [TierNoteEntryDocumentKey.isCompDependent]: true,
        },
      },
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: 0,
    });
  });
});
