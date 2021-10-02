import {
  CharaAnalysisPublishPayload,
  DragonAnalysisPublishPayload,
  SupportedLanguages,
  UnitType,
} from '../../../api-def/api';
import {Application, createApp} from '../../../app';
import {AnalysisController} from '../../post/analysis/controller';
import {UnitInfoLookupController} from './controller';


describe('Unit info lookup controller', () => {
  let app: Application;

  const payloadChara: CharaAnalysisPublishPayload = {
    uid: 'uid',
    type: UnitType.CHARACTER,
    lang: SupportedLanguages.CHT,
    unitId: 10950101,
    summary: 'summary',
    summonResult: 'summon',
    passives: 'passive',
    normalAttacks: 'normal',
    forceStrikes: 'force',
    skills: [{
      name: 'skill',
      info: 'info',
      rotations: 'rot',
      tips: 'tips',
    }],
    tipsBuilds: 'tips',
    videos: 'video',
  };

  const payloadDragon: DragonAnalysisPublishPayload = {
    uid: 'uid',
    type: UnitType.DRAGON,
    lang: SupportedLanguages.CHT,
    unitId: 10,
    summary: 'dragonSummary',
    summonResult: 'dragonSummon',
    normalAttacks: 'dragonNormal',
    ultimate: 'dragonUltimate',
    passives: 'dragonPassive',
    notes: 'dragonNotes',
    suitableCharacters: 'dragonChara',
    videos: 'dragonVideo',
  };

  const insert3Chara = async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10930401});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10950102});
  };

  const insert3Chara3Dragon = async () => {
    await insert3Chara();
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, unitId: 20030103});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, unitId: 20040102});
    await AnalysisController.publishDragonAnalysis(app.mongoClient, {...payloadDragon, unitId: 20040405});
  };

  beforeAll(async () => {
    app = await createApp();
  });

  beforeEach(async () => {
    await app.reset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns analysis meta correctly', async () => {
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10950101});
    await AnalysisController.publishCharaAnalysis(app.mongoClient, {...payloadChara, unitId: 10950102});

    const postListResult = await UnitInfoLookupController.getAnalysisLookup(
      app.mongoClient, SupportedLanguages.CHT,
    );

    expect(Object.values(postListResult).map((post) => post.unitId)).toStrictEqual([10950101, 10950102]);
  });

  it('returns without any error if no analysis available', async () => {
    const postListResult = await UnitInfoLookupController.getAnalysisLookup(app.mongoClient, SupportedLanguages.CHT);

    expect(Object.keys(postListResult).length).toBe(0);
  });

  it('returns without any error if no analysis matching the language', async () => {
    await insert3Chara();

    const postListResult = await UnitInfoLookupController.getAnalysisLookup(app.mongoClient, SupportedLanguages.EN);

    expect(Object.keys(postListResult).length).toBe(0);
  });

  it('returns analysis type for each post entry', async () => {
    await insert3Chara3Dragon();

    const postListResult = await UnitInfoLookupController.getAnalysisLookup(app.mongoClient, SupportedLanguages.CHT);

    expect(Object.values(postListResult).filter((entry) => entry.type === UnitType.CHARACTER).length).toBe(3);
    expect(Object.values(postListResult).filter((entry) => entry.type === UnitType.DRAGON).length).toBe(3);
  });

  it('returns modification and publish timestamps for each post entry', async () => {
    await insert3Chara3Dragon();

    const postListResult = await UnitInfoLookupController.getAnalysisLookup(app.mongoClient, SupportedLanguages.CHT);

    expect(
      Object.values(postListResult)
        .map((entry) => entry.modifiedEpoch)
        .filter((timestamp) => !!timestamp)
        .length,
    )
      .toBe(6);
    expect(
      Object.values(postListResult)
        .map((entry) => entry.publishedEpoch)
        .filter((timestamp) => !!timestamp)
        .length,
    )
      .toBe(6);
  });
});
