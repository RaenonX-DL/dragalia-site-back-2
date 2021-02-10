import {Server} from 'http';
import {default as request} from 'supertest';
import {ApiEndPoints, ApiResponseCode, BaseResponse} from '../../api-def/api';
import {runServer} from '../../app';

describe(`GET ${ApiEndPoints.ROOT} - the root endpoint`, () => {
  let server: Server;

  beforeEach(() => {
    server = runServer();
  });

  afterEach((done) => {
    server.close(done);
  });

  it('should return a response with successful code 100', async () => {
    const result = await request(server).get(ApiEndPoints.ROOT);
    expect(result.status).toBe(200);

    const json: BaseResponse = result.body as BaseResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });
});
