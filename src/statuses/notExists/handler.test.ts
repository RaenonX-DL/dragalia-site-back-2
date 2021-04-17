import {default as request} from 'supertest';

import {ApiEndPoints, ApiResponseCode, BaseResponse} from '../../api-def/api';
import {Application, createApp} from '../../app';

describe(`[Server] GET ${ApiEndPoints.NOT_EXISTS} - not-existed endpoint`, () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 404', async () => {
    const result = await request(app.express).get(ApiEndPoints.NOT_EXISTS);
    expect(result.status).toBe(404);

    const json: BaseResponse = result.body as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_ENDPOINT_NOT_EXISTS);
    expect(json.success).toBe(false);
  });
});
