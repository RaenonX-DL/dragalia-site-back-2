import {Server} from 'http';
import {default as request} from 'supertest';
import {ApiEndPoints, ApiResponseCode} from '../../api-def/api';
import {runServer} from '../../app';
import {RootResponse} from '../../endpoints/root/response';

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

    const json: RootResponse = result.body as RootResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_INTERNAL_ERROR);
    expect(json.success).toBe(false);
  });
});
