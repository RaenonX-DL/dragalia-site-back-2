import {Server} from 'http';
import {default as request} from 'supertest';
import {ApiEndPoints, ApiResponseCode, BaseResponse} from '../../api-def/api';
import {runServer} from '../../app';

describe(`GET ${ApiEndPoints.NOT_EXISTS} - not-existed endpoint`, () => {
  let server: Server;

  beforeEach(() => {
    server = runServer();
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should return 404', async () => {
    const result = await request(server).get(ApiEndPoints.NOT_EXISTS);
    expect(result.status).toBe(404);

    const json: BaseResponse = result.body as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_ENDPOINT_NOT_EXISTS);
    expect(json.success).toBe(false);
  });
});
