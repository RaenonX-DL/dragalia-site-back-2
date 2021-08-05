import {SupportedLanguages} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {UnitNameRefController} from './controller';
import {UnitNameRefEntry} from './model';


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
});
