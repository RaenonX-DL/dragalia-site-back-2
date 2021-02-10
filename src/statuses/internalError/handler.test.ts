import {Server} from 'http';
import {default as request} from 'supertest';
import {ApiEndPoints, ApiResponseCode, BaseResponse} from '../../api-def/api';
import {runServer} from '../../app';

describe(`GET ${ApiEndPoints.ERROR_TEST} - the error testing endpoint`, () => {
  let server: Server;

  beforeEach(() => {
    server = runServer();
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should return 500', async () => {
    const result = await request(server).get(ApiEndPoints.ERROR_TEST);
    expect(result.status).toBe(500);

    const json: BaseResponse = result.body as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INTERNAL_ERROR);
    expect(json.success).toBe(false);
  });
});
