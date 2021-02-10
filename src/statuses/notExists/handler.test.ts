import {Server} from 'http';
import {default as request} from 'supertest';
import {ApiEndPoints, ApiResponseCode} from '../../api-def/api';
import {runServer} from '../../app';
import {RootResponse} from '../../endpoints/root/response';

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

    const json: RootResponse = result.body as RootResponse;
    expect(json.code).toBe(ApiResponseCode.FAILED_ENDPOINT_NOT_EXISTS);
    expect(json.success).toBe(false);
  });
});
