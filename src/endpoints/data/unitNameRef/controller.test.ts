import {mongoExecInTransaction} from '../../../../test/utils/mongo';
import {SupportedLanguages} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {UnitNameRefController} from './controller';
import {DuplicatedNamesError} from './error';
import {UnitNameRefEntry, UnitNameRefEntryDocumentKey} from './model';


describe('Unit name reference data controller', () => {
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

  it('returns empty object if no data', async () => {
    const data = await UnitNameRefController.getData(app.mongoClient, SupportedLanguages.EN);

    expect(data).toStrictEqual({});
  });

  it('returns an object filtered by language', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit 2', unitId: 10750101}),
      new UnitNameRefEntry({lang: SupportedLanguages.JP, name: 'Unit 3', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    const data = await UnitNameRefController.getData(app.mongoClient, SupportedLanguages.EN);

    expect(Object.keys(data).sort()).toStrictEqual(['Unit', 'Unit 2']);
  });

  it('returns empty object if no data in the requested lang', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit 2', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    const data = await UnitNameRefController.getData(app.mongoClient, SupportedLanguages.JP);

    expect(data).toStrictEqual({});
  });

  it('returns empty entry list if no data', async () => {
    const data = await UnitNameRefController.getEntries(app.mongoClient, SupportedLanguages.EN);

    expect(data).toStrictEqual([]);
  });

  it('returns a list containing the name ref entries in the given language', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit 2', unitId: 10750101}),
      new UnitNameRefEntry({lang: SupportedLanguages.JP, name: 'Unit 3', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    const data = await UnitNameRefController.getEntries(app.mongoClient, SupportedLanguages.EN);

    expect(data.map((entry) => entry.name).sort()).toStrictEqual(['Unit', 'Unit 2']);
  });

  it('returns empty list if no matching entry in the given language', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit 2', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    const data = await UnitNameRefController.getEntries(app.mongoClient, SupportedLanguages.JP);

    expect(data).toStrictEqual([]);
  });

  it('fails to update if the names are duplicated', async () => {
    const fn = async () => {
      await UnitNameRefController.updateRefs(
        app.mongoClient,
        SupportedLanguages.EN,
        [
          {unitId: 10950101, name: 'Unit 1'},
          {unitId: 10950201, name: 'Unit 1'},
        ],
      );
    };

    await expect(fn).rejects.toThrow(DuplicatedNamesError);
  });

  it('keeps the original name references if failed to update', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit A', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit B', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    const fn = async () => {
      await UnitNameRefController.updateRefs(
        app.mongoClient,
        SupportedLanguages.EN,
        [
          {unitId: 10950101, name: 'Unit 1'},
          {unitId: 10950201, name: 'Unit 1'},
        ],
      );
    };

    await expect(fn).rejects.toThrow(DuplicatedNamesError);

    await mongoExecInTransaction(app.mongoClient, async () => {
      expect((await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray()).length).toBe(2);
    });
  });

  it('updates even if multiple entries share the same unit', async () => {
    await UnitNameRefController.updateRefs(
      app.mongoClient,
      SupportedLanguages.EN,
      [
        {unitId: 10950101, name: 'Unit 1'},
        {unitId: 10950101, name: 'Unit 2'},
      ],
    );

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray();
      expect(data.map((entry) => entry[UnitNameRefEntryDocumentKey.name]).sort()).toStrictEqual(['Unit 1', 'Unit 2']);
    });
  });

  it('accepts empty update unit name ref list', async () => {
    await UnitNameRefController.updateRefs(app.mongoClient, SupportedLanguages.EN, []);

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray();
      expect(data.map((entry) => entry[UnitNameRefEntryDocumentKey.name]).sort()).toStrictEqual([]);
    });
  });

  it('removes entries that are not contained in the update list', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit A', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit 1', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    await UnitNameRefController.updateRefs(
      app.mongoClient,
      SupportedLanguages.EN,
      [
        {unitId: 10850101, name: 'Unit 1'},
        {unitId: 10950101, name: 'Unit 2'},
      ],
    );

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray();
      expect(data.map((entry) => entry[UnitNameRefEntryDocumentKey.name]).sort()).toStrictEqual(['Unit 1', 'Unit 2']);
    });
  });

  it('updates the entries in the given language only', async () => {
    const dataArray = [
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit A', unitId: 10950101}),
      new UnitNameRefEntry({lang: SupportedLanguages.EN, name: 'Unit B', unitId: 10850101}),
      new UnitNameRefEntry({lang: SupportedLanguages.CHT, name: 'Unit 1', unitId: 10850101}),
    ].map((entry) => entry.toObject());
    await UnitNameRefEntry.getCollection(app.mongoClient).insertMany(dataArray);

    await UnitNameRefController.updateRefs(
      app.mongoClient,
      SupportedLanguages.EN,
      [{
        unitId: 10850101,
        name: 'Unit C',
      }],
    );

    await mongoExecInTransaction(app.mongoClient, async () => {
      const data = await UnitNameRefEntry.getCollection(app.mongoClient).find().toArray();
      expect(data.map((entry) => entry[UnitNameRefEntryDocumentKey.name]).sort()).toStrictEqual(['Unit 1', 'Unit C']);
    });
  });
});
