import {Server} from 'http';
import {default as request} from 'supertest';
import MongoMemoryServer from 'mongodb-memory-server-core';
import {ApiEndPoints, ApiResponseCode, UserLoginPayload, UserLoginResponse} from '../../../api-def/api';
import {runServer} from '../../../app';
import {clearServer, createServer, destroyServer} from '../../../../test/mongodbMem';

describe(`GET ${ApiEndPoints.USER_LOGIN} - the user login endpoint`, () => {
  let server: Server;
  let mongoServer: MongoMemoryServer;

  const userPayload1: UserLoginPayload = {
    googleEmail: 'fake@gmail.com',
    googleUid: '101524038922984790357',
  };

  beforeAll(async () => {
    mongoServer = await createServer();
  });

  beforeEach(() => {
    server = runServer();
  });

  afterEach((done) => {
    server.close(done);
    clearServer();
  });

  afterAll(async () => {
    await destroyServer(mongoServer);
  });

  it('should register a new user', async () => {
    const result = await request(server).post(ApiEndPoints.USER_LOGIN).query(userPayload1);
    expect(result.status).toBe(200);

    const json: UserLoginResponse = result.body as UserLoginResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS_NEW);
    expect(json.success).toBe(true);
  });

  it('should know an user has registered', async () => {
    // Initial call
    await request(server).post(ApiEndPoints.USER_LOGIN).query(userPayload1);

    const result = await request(server).get(ApiEndPoints.USER_LOGIN).query(userPayload1);
    expect(result.status).toBe(200);

    const json: UserLoginResponse = result.body as UserLoginResponse;
    expect(json.code).toBe(ApiResponseCode.SUCCESS);
    expect(json.success).toBe(true);
  });
});
