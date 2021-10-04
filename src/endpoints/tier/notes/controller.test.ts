import {SupportedLanguages} from '../../../api-def/api';
import {DocumentBaseKey} from '../../../api-def/models';
import {Application, createApp} from '../../../app';
import * as utils from '../../../utils/misc';
import {TierNoteController} from './controller';
import {TierNote, TierNoteEntryDocumentKey, UnitTierNote, UnitTierNoteDocument, UnitTierNoteDocumentKey} from './model';


describe('Tier note data controller', () => {
  let app: Application;

  const epoch = 100000;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    jest.spyOn(utils, 'getCurrentEpoch').mockReturnValue(epoch);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('getAllTierNotes()', () => {
    it('returns empty object if no data', async () => {
      expect(await TierNoteController.getAllTierNotes(app.mongoClient, SupportedLanguages.CHT)).toStrictEqual({});
    });

    it('returns an object there are data available', async () => {
      const dataArray = [
        new UnitTierNote({
          unitId: 10950101,
          points: [],
          tier: {
            conAi: new TierNote({
              ranking: 'S',
              note: {[SupportedLanguages.CHT]: 'A', [SupportedLanguages.EN]: 'B'},
              isCompDependent: true,
            }),
          },
          lastUpdateEpoch: 0,
        }),
      ].map((entry) => entry.toObject());
      await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

      const data = await TierNoteController.getAllTierNotes(app.mongoClient, SupportedLanguages.CHT);

      expect(data).toStrictEqual({
        10950101: {
          points: [],
          tier: {conAi: {ranking: 'S', note: 'A', isCompDependent: true}},
          lastUpdateEpoch: 0,
        },
      });
    });

    it('returns tier note in alternative language if the desired does not have one', async () => {
      const dataArray = [
        new UnitTierNote({
          unitId: 10950101,
          points: [],
          tier: {
            conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.CHT]: 'A'}, isCompDependent: true}),
          },
          lastUpdateEpoch: 0,
        }),
      ].map((entry) => entry.toObject());
      await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

      const data = await TierNoteController.getAllTierNotes(app.mongoClient, SupportedLanguages.EN);

      expect(data).toStrictEqual({
        10950101: {
          points: [],
          tier: {
            conAi: {ranking: 'S', note: 'A', isCompDependent: true},
          },
          lastUpdateEpoch: 0,
        },
      });
    });
  });

  describe('getUnitTierNoteEdit()', () => {
    it('returns `null` if no existing tier note available', async () => {
      const data = await TierNoteController.getUnitTierNoteSingle(app.mongoClient, SupportedLanguages.CHT, 10950101);

      expect(data).toStrictEqual(null);
    });

    it('returns the requested tier note', async () => {
      const dataArray = [
        new UnitTierNote({
          unitId: 10950101,
          points: [],
          tier: {
            conAi: new TierNote({
              ranking: 'S',
              note: {[SupportedLanguages.CHT]: 'A', [SupportedLanguages.EN]: 'B'},
              isCompDependent: true,
            }),
          },
          lastUpdateEpoch: 0,
        }),
      ].map((entry) => entry.toObject());
      await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

      const data = await TierNoteController.getUnitTierNoteSingle(app.mongoClient, SupportedLanguages.CHT, 10950101);

      expect(data).toStrictEqual({
        points: [],
        tier: {
          conAi: {ranking: 'S', note: 'A', isCompDependent: true},
        },
        lastUpdateEpoch: 0,
      });
    });
  });

  describe('updateUnitTierNote()', () => {
    it('adds new tier note if not available before', async () => {
      await TierNoteController.updateUnitTierNote(
        app.mongoClient, SupportedLanguages.CHT, 10950101,
        {
          points: ['idA'],
          tier: {conAi: {ranking: 'S', note: 'A', isCompDependent: true}},
        },
      );

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

      await TierNoteController.updateUnitTierNote(
        app.mongoClient, SupportedLanguages.CHT, 10950101,
        {
          points: ['idA'],
          tier: {conAi: {ranking: 'A', note: 'C', isCompDependent: true}},
        },
      );

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

    it('adds tier note in given language if necessary', async () => {
      const dataArray = [
        new UnitTierNote({
          unitId: 10950101,
          points: [],
          tier: {
            conAi: new TierNote({
              ranking: 'S', note: {[SupportedLanguages.EN]: 'B'}, isCompDependent: true,
            }),
          },
          lastUpdateEpoch: 0,
        }),
      ].map((entry) => entry.toObject());
      await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

      await TierNoteController.updateUnitTierNote(
        app.mongoClient, SupportedLanguages.CHT, 10950101,
        {
          points: ['idA'],
          tier: {conAi: {ranking: 'A', note: 'C', isCompDependent: true}},
        },
      );

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

      await TierNoteController.updateUnitTierNote(
        app.mongoClient, SupportedLanguages.CHT, 10950101,
        {
          points: ['idA'],
          tier: {conSolo: {ranking: 'A', note: 'C', isCompDependent: false}},
        },
      );

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

      await TierNoteController.updateUnitTierNote(
        app.mongoClient, SupportedLanguages.CHT, 10950101,
        {
          points: ['idA'],
          tier: {conSolo: {ranking: 'A', note: 'B', isCompDependent: false}},
        },
      );

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
  });
});
