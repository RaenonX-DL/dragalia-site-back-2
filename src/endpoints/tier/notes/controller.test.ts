import {SupportedLanguages} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {TierNoteController} from './controller';
import {UnitTierNote} from './model';


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
            conAi: {
              ranking: 'S',
              note: {
                [SupportedLanguages.CHT]: 'A',
                [SupportedLanguages.EN]: 'B',
              },
              isCompDependent: true,
            },
          },
          lastUpdateEpoch: 0,
        }),
      ].map((entry) => entry.toObject());
      await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

      const data = await TierNoteController.getAllTierNotes(app.mongoClient, SupportedLanguages.CHT);

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

    it('returns tier note in alternative language if the desired does not have one', async () => {
      const dataArray = [
        new UnitTierNote({
          unitId: 10950101,
          points: [],
          tier: {
            conAi: {
              ranking: 'S',
              note: {[SupportedLanguages.CHT]: 'A'},
              isCompDependent: true,
            },
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
      const data = await TierNoteController.getUnitTierNoteEdit(app.mongoClient, SupportedLanguages.CHT, 10950101);

      expect(data).toStrictEqual({
        points: [],
        tier: {
          conAi: {ranking: 'S', note: 'A', isCompDependent: true},
        },
        lastUpdateEpoch: 0,
      });
    });

    it('returns the requested tier note', async () => {
      const dataArray = [
        new UnitTierNote({
          unitId: 10950101,
          points: [],
          tier: {
            conAi: {
              ranking: 'S',
              note: {
                [SupportedLanguages.CHT]: 'A',
                [SupportedLanguages.EN]: 'B',
              },
              isCompDependent: true,
            },
          },
          lastUpdateEpoch: 0,
        }),
      ].map((entry) => entry.toObject());
      await UnitTierNote.getCollection(app.mongoClient).insertMany(dataArray);

      const data = await TierNoteController.getUnitTierNoteEdit(app.mongoClient, SupportedLanguages.CHT, 10950101);

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
});