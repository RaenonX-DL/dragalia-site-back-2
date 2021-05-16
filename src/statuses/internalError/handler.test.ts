

import {ApiEndPoints, ApiResponseCode, BaseResponse} from '../../api-def/api';
import {Application, createApp} from '../../app';

describe(`[Server] GET ${ApiEndPoints.ERROR_TEST} - the error testing endpoint`, () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 500', async () => {
    const result = await app.app.inject().get(ApiEndPoints.ERROR_TEST);
    expect(result.statusCode).toBe(500);

    const json: BaseResponse = result.json() as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INTERNAL_ERROR);
    expect(json.success).toBe(false);
  });
});
