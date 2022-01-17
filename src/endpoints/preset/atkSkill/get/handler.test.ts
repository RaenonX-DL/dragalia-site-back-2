import {ObjectId} from 'mongodb';

import {
  ApiEndPoints,
  ApiResponseCode,
  FailedResponse,
  GetAtkSkillPresetResponse,
} from '../../../../api-def/api';
import {UserDocumentKey} from '../../../../api-def/models';
import {Application, createApp} from '../../../../app';
import {UserController} from '../../../userControl/controller';
import {User} from '../../../userControl/model';
import {AtkSkillPreset} from '../model';


describe('Get ATK skill preset handler', () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockGetUser = () => {
    jest.spyOn(UserController, 'getUserData').mockResolvedValue(new User({
      [UserDocumentKey.name]: 'name',
      [UserDocumentKey.email]: 'email',
      [UserDocumentKey.image]: 'image',
      [UserDocumentKey.isAdmin]: false,
    }));
  };

  it('returns the preset if found', async () => {
    mockGetUser();

    const insertResult = await AtkSkillPreset.getCollection(app.mongoClient)
      .insertOne(new AtkSkillPreset({preset: {a: 7}}).toObject());

    const response = await app.app.inject().get(ApiEndPoints.PRESET_ATK_SKILL_INPUT).query({
      uid: 'dummy',
      presetId: insertResult.insertedId.toHexString(),
    });
    expect(response.statusCode).toBe(200);

    const json: GetAtkSkillPresetResponse = response.json() as GetAtkSkillPresetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.preset).toStrictEqual({a: 7});
  });

  it('returns that the preset does not exist', async () => {
    mockGetUser();

    const response = await app.app.inject().get(ApiEndPoints.PRESET_ATK_SKILL_INPUT).query({
      uid: 'dummy',
      presetId: new ObjectId().toHexString(),
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_PRESET_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('returns null if the preset ID is not a valid object ID', async () => {
    mockGetUser();

    await AtkSkillPreset.getCollection(app.mongoClient)
      .insertOne(new AtkSkillPreset({preset: {a: 7}}).toObject());

    const response = await app.app.inject().get(ApiEndPoints.PRESET_ATK_SKILL_INPUT).query({
      uid: 'dummy',
      presetId: 'a',
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_PRESET_NOT_EXISTS);
    expect(json.success).toBe(false);
  });

  it('blocks unregistered access', async () => {
    const response = await app.app.inject().post(ApiEndPoints.PRESET_ATK_SKILL_INPUT).payload({
      uid: 'dummy',
      preset: {a: 7},
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_USER_NOT_SIGNED_UP);
    expect(json.success).toBe(false);
  });

  it('blocks anonymous access', async () => {
    const response = await app.app.inject().post(ApiEndPoints.PRESET_ATK_SKILL_INPUT).payload({
      uid: '',
      preset: {a: 7},
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
    expect(json.success).toBe(false);
  });
});
