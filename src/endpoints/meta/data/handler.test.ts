import {ObjectId} from 'mongodb';

import {ApiEndPoints, ApiResponseCode, FailedResponse, SupportedLanguages} from '../../../api-def/api';
import {Application, createApp} from '../../../app';


describe('Data page meta handler - Generic', () => {
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

  it('returns data type unhandled', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_DATA).query({
      uid: '',
      lang: SupportedLanguages.EN,
      type: 'type',
      id: 'id',
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_UNHANDLED_DATA_TYPE);
    expect(json.success).toBe(false);
  });

  it('returns data not found', async () => {
    const response = await app.app.inject().get(ApiEndPoints.PAGE_META_DATA).query({
      uid: '',
      lang: SupportedLanguages.EN,
      type: 'tierKeyPoint',
      id: new ObjectId().toHexString(),
    });
    expect(response.statusCode).toBe(200);

    const json: FailedResponse = response.json() as FailedResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_DATA_NOT_EXISTS);
    expect(json.success).toBe(false);
  });
});
