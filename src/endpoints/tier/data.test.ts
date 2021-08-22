import {mongoExecInTransaction} from '../../../test/utils/mongo';
import {SupportedLanguages} from '../../api-def/api/other/lang';
import {Application, createApp} from '../../app';
import {TierNote, UnitTierNote, UnitTierNoteDocumentKey} from './notes/model';
import {KeyPointController} from './points/controller';
import {KeyPointEntry, KeyPointEntryDocumentKey} from './points/model';


describe('Tier note data control', () => {
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

  it('removes key point references from units upon removing a key point entry', async () => {
    const pointArray = [
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
      new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
    ].map((entry) => entry.toObject());
    const pointIds = Object
      .values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(pointArray)).insertedIds)
      .map((id) => id.toHexString());

    const noteArray = [
      new UnitTierNote({
        unitId: 10950101,
        points: [pointIds[2]],
        tier: {
          conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.EN]: 'B'}, isCompDependent: true}),
        },
        lastUpdateEpoch: 0,
      }),
    ].map((entry) => entry.toObject());
    await UnitTierNote.getCollection(app.mongoClient).insertMany(noteArray);

    await KeyPointController.updateEntries(
      app.mongoClient,
      SupportedLanguages.CHT,
      [
        {id: pointIds[0], type: 'strength', description: 'CHT 4'},
        {id: pointIds[1], type: 'strength', description: 'CHT 5'},
      ],
    );

    await mongoExecInTransaction(app.mongoClient, async () => {
      const points = (await KeyPointEntry.getCollection(app.mongoClient).find().toArray())
        .map((entry) => entry[KeyPointEntryDocumentKey.description][SupportedLanguages.CHT])
        .sort();
      expect(points).toStrictEqual(['CHT 4', 'CHT 5']);

      const notes = (await UnitTierNote.getCollection(app.mongoClient).find().toArray())
        .map((entry) => entry[UnitTierNoteDocumentKey.points])
        .sort();
      expect(notes).toStrictEqual([[]]);
    });
  });

  describe('Key point references', () => {
    let pointIds: Array<string>;

    beforeEach(async () => {
      const pointArray = [
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 1'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 2'}}),
        new KeyPointEntry({type: 'strength', description: {[SupportedLanguages.CHT]: 'CHT 3'}}),
      ].map((entry) => entry.toObject());
      pointIds = Object
        .values((await KeyPointEntry.getCollection(app.mongoClient).insertMany(pointArray)).insertedIds)
        .map((id) => id.toHexString());

      const noteArray = [
        new UnitTierNote({
          unitId: 10950101,
          points: [pointIds[2]],
          tier: {
            conAi: new TierNote({ranking: 'S', note: {[SupportedLanguages.EN]: 'B'}, isCompDependent: true}),
          },
          lastUpdateEpoch: 0,
        }),
        new UnitTierNote({
          unitId: 10950102,
          points: [pointIds[0], pointIds[2]],
          tier: {
            conAi: new TierNote({ranking: 'A', note: {[SupportedLanguages.EN]: 'B'}, isCompDependent: true}),
          },
          lastUpdateEpoch: 0,
        }),
      ].map((entry) => entry.toObject());
      await UnitTierNote.getCollection(app.mongoClient).insertMany(noteArray);
    });

    it('returns unit IDs that references a certain key point', async () => {
      const unitIds = await KeyPointController.getReferencedUnitIds(app.mongoClient, pointIds[2]);
      expect(unitIds.sort()).toStrictEqual([10950101, 10950102]);
    });

    it('returns an empty list if no units are linked to a certain key point', async () => {
      const unitIds = await KeyPointController.getReferencedUnitIds(app.mongoClient, pointIds[1]);
      expect(unitIds.sort()).toStrictEqual([]);
    });
  });
});
