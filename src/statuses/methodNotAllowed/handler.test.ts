

import {ApiEndPoints, ApiResponseCode, BaseResponse} from '../../api-def/api';
import {Application, createApp} from '../../app';


describe(`[Server] POST ${ApiEndPoints.ROOT} - root endpoint in undefined method`, () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 405', async () => {
    const result = await app.app.inject().post(ApiEndPoints.ROOT);
    expect(result.statusCode).toBe(405);

    const json: BaseResponse = result.json() as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_METHOD_NOT_ALLOWED);
    expect(json.success).toBe(false);
  });
});
