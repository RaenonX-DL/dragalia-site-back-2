import {ApiEndPoints, ApiResponseCode, FailedResponse, SetAtkSkillPresetResponse} from '../../../../api-def/api';
import {UserDocumentKey} from '../../../../api-def/models/user';
import {Application, createApp} from '../../../../app';
import {UserController} from '../../../userControl/controller';
import {User} from '../../../userControl/model';


describe('Set ATK skill preset handler', () => {
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
      [UserDocumentKey.createdAt]: new Date(),
      [UserDocumentKey.updatedAt]: new Date(),
    }));
  };

  it('makes an ATK skill preset', async () => {
    mockGetUser();

    const response = await app.app.inject().post(ApiEndPoints.PRESET_ATK_SKILL_INPUT).payload({
      uid: 'dummy',
      preset: {a: 7},
    });
    expect(response.statusCode).toBe(200);

    const json: SetAtkSkillPresetResponse = response.json() as SetAtkSkillPresetResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
    expect(json.presetId).toBeDefined();
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
