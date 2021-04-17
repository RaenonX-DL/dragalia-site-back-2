import {default as request} from 'supertest';

import {ApiEndPoints, ApiResponseCode, BaseResponse} from '../../api-def/api';
import {Application, createApp} from '../../app';

describe(`[Server] GET ${ApiEndPoints.ROOT} - the root endpoint`, () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns with successful code 100', async () => {
    const result = await request(app.express).get(ApiEndPoints.ROOT);
    expect(result.status).toBe(200);

    const json: BaseResponse = result.body as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });
});
