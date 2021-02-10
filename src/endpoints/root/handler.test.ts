import {Server} from 'http';
import {default as request} from 'supertest';
import {ApiEndPoints, ApiResponseCode} from '../../api-def/api';
import {runServer} from '../../app';
import {RootResponse} from './response';

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

    const json: RootResponse = result.body as RootResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });
});
