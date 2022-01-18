import {ObjectId} from 'mongodb';

import {Application, createApp} from '../../../app';
import {AtkSkillPresetController} from './controller';
import {AtkSkillPreset} from './model';


describe('ATK skill input preset controller', () => {
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

  it('returns the preset if found', async () => {
    const insertResult = await (await AtkSkillPreset.getCollection(app.mongoClient))
      .insertOne(new AtkSkillPreset({preset: {a: 7}}).toObject());

    const preset = await AtkSkillPresetController.getPreset(app.mongoClient, insertResult.insertedId.toHexString());
    expect(preset).toStrictEqual({a: 7});
  });

  it('returns null if the preset ID does not exist', async () => {
    const preset = await AtkSkillPresetController.getPreset(app.mongoClient, new ObjectId().toHexString());
    expect(preset).toBeNull();
  });

  it('returns null if the preset ID is not a valid object ID', async () => {
    await (await AtkSkillPreset.getCollection(app.mongoClient))
      .insertOne(new AtkSkillPreset({preset: {a: 7}}).toObject());

    const preset = await AtkSkillPresetController.getPreset(app.mongoClient, 'a');
    expect(preset).toBeNull();
  });

  it('makes preset and return its ID', async () => {
    const presetId = await AtkSkillPresetController.makePreset(app.mongoClient, {a: 7});
    expect(presetId).toBeDefined();
  });
});
