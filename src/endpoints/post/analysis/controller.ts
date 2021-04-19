import {MongoClient} from 'mongodb';

import {
  AnalysisGetContent,
  AnalysisType,
  CharaAnalysisEditPayload,
  CharaAnalysisPublishPayload,
  DragonAnalysisEditPayload,
  DragonAnalysisPublishPayload,
} from '../../../api-def/api';
import {NextSeqIdArgs} from '../../../base/controller/seq';
import {UpdateResult} from '../../../base/enum/updateResult';
import {PostController, PostGetResult, PostListResult} from '../base/controller';
import {PostDocumentKey} from '../base/model';
import {PostGetSuccessResponseParam} from '../base/response/post/get';
import {AnalysisResponse} from './base/response';
import {UnhandledAnalysisTypeError} from './error';
import {
  CharaAnalysis,
  CharaAnalysisDocumentKey,
  dbInfo,
  DragonAnalysis,
  DragonAnalysisDocumentKey,
  UnitAnalysis,
  UnitAnalysisDocumentKey,
} from './model';
import {AnalysisDocument} from './model/type';


/**
 * Result object of getting an analysis.
 */
class AnalysisGetResult extends PostGetResult<AnalysisDocument> {
  /**
   * Construct an analysis get result object.
   *
   * @param {AnalysisDocument} post
   * @param {boolean} isAltLang
   * @param {Array<string>} otherLangs
   */
  constructor(post: AnalysisDocument, isAltLang: boolean, otherLangs: Array<string>) {
    super(post, isAltLang, otherLangs);
  }

  /**
   * @inheritDoc
   */
  toResponseReady(): AnalysisResponse {
    const base: PostGetSuccessResponseParam & AnalysisGetContent = {
      ...super.toResponseReady(),
      type: this.post[UnitAnalysisDocumentKey.type],
      title: this.post[PostDocumentKey.title],
      summary: this.post[UnitAnalysisDocumentKey.summary],
      summonResult: this.post[UnitAnalysisDocumentKey.summonResult],
      passives: this.post[UnitAnalysisDocumentKey.passives],
      normalAttacks: this.post[UnitAnalysisDocumentKey.normalAttacks],
      videos: this.post[UnitAnalysisDocumentKey.videos],
      story: this.post[UnitAnalysisDocumentKey.story],
      keywords: this.post[UnitAnalysisDocumentKey.keywords],
    };

    if (base.type === AnalysisType.CHARACTER) {
      return {
        ...base,
        forceStrikes: this.post[CharaAnalysisDocumentKey.forceStrike],
        skills: this.post[CharaAnalysisDocumentKey.skills],
        tipsBuilds: this.post[CharaAnalysisDocumentKey.tipsBuilds],
      };
    }

    if (base.type === AnalysisType.DRAGON) {
      return {
        ...base,
        ultimate: this.post[DragonAnalysisDocumentKey.ultimate],
        notes: this.post[DragonAnalysisDocumentKey.notes],
        suitableCharacters: this.post[DragonAnalysisDocumentKey.suitableCharacters],
      };
    }

    throw new UnhandledAnalysisTypeError(+base.seqId, base.type);
  }
}

/**
 * Analysis controller.
 */
export class AnalysisController extends PostController {
  /**
   * Same as {@link UnitAnalysis.getNextSeqId}.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {number?} seqId desired post sequential ID to use
   * @param {boolean} increase increase the counter or not
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, {seqId, increase}: NextSeqIdArgs,
  ): Promise<number> {
    return await UnitAnalysis.getNextSeqId(mongoClient, dbInfo, {seqId, increase});
  }

  /**
   * Publish a new character analysis and get its sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CharaAnalysisPublishPayload} payload payload for creating a character analysis
   * @return {Promise<number>} post sequential ID
   */
  static async publishCharaAnalysis(
    mongoClient: MongoClient, payload: CharaAnalysisPublishPayload,
  ): Promise<number> {
    payload = {
      ...payload,
      seqId: await AnalysisController.getNextSeqId(mongoClient, {seqId: payload.seqId}),
    };

    const post: CharaAnalysis = CharaAnalysis.fromPayload(payload);

    await CharaAnalysis.getCollection(mongoClient).insertOne(post.toObject());

    return post.seqId;
  }

  /**
   * Publish a new dragon analysis and get its sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {DragonAnalysisPublishPayload} payload payload for creating a dragon analysis
   * @return {Promise<number>} post sequential ID
   */
  static async publishDragonAnalysis(
    mongoClient: MongoClient, payload: DragonAnalysisPublishPayload,
  ): Promise<number> {
    payload = {
      ...payload,
      seqId: await AnalysisController.getNextSeqId(mongoClient, {seqId: payload.seqId}),
    };

    const post: DragonAnalysis = DragonAnalysis.fromPayload(payload);

    await DragonAnalysis.getCollection(mongoClient).insertOne(post.toObject());

    return post.seqId;
  }

  /**
   * Edit a character analysis.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CharaAnalysisEditPayload} payload payload to edit a character analysis
   * @return {Promise<UpdateResult>} result of editing a character analysis
   */
  static async editCharaAnalysis(
    mongoClient: MongoClient, payload: CharaAnalysisEditPayload,
  ): Promise<UpdateResult> {
    const analysis: CharaAnalysis = CharaAnalysis.fromPayload(payload);

    return await AnalysisController.editPost(
      CharaAnalysis.getCollection(mongoClient),
      payload.seqId, payload.lang,
      analysis.toObject(), payload.modifyNote,
    );
  }

  /**
   * Edit a dragon analysis.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {DragonAnalysisEditPayload} payload payload to edit a dragon analysis
   * @return {Promise<UpdateResult>} result of editing a dragon analysis
   */
  static async editDragonAnalysis(
    mongoClient: MongoClient, payload: DragonAnalysisEditPayload,
  ): Promise<UpdateResult> {
    const analysis: DragonAnalysis = DragonAnalysis.fromPayload(payload);

    return await AnalysisController.editPost(
      DragonAnalysis.getCollection(mongoClient),
      payload.seqId, payload.lang,
      analysis.toObject(), payload.modifyNote,
    );
  }

  /**
   * Get a list of analyses.
   *
   * @param {MongoClient} mongoClient mongo client to perform the listing
   * @param {string} langCode language code of the analyses
   * @param {number} start starting index of the analysis lists
   * @param {number} limit maximum count of the posts to return
   * @return {Promise<PostListResult>} post listing result
   */
  static async getAnalysisList(
    mongoClient: MongoClient, langCode: string, start = 0, limit = 0,
  ): Promise<PostListResult> {
    const options = {
      start,
      limit,
      additionalProjection: {
        [UnitAnalysisDocumentKey.type]: 1,
      },
    };

    return AnalysisController.listPosts(UnitAnalysis.getCollection(mongoClient), langCode, options);
  }

  /**
   * Get a specific analysis.
   *
   * If this is called for analysis displaying purpose,
   * `incCount` should be `true`. Otherwise, it should be `false`.
   *
   * Returns the alternative language version
   * if the analysis of the given sequential ID
   * in the specified language is not available,
   * but the version in the other language is available.
   *
   * Returns ``null`` if the post with the given sequential ID is not found.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {number} seqId sequential ID of the post
   * @param {string} langCode language code of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @return {Promise<PostGetResult<QuestPostDocument>>} result of getting a quest post
   */
  static async getAnalysis(
    mongoClient: MongoClient, seqId: number, langCode = 'cht', incCount = true,
  ): Promise<AnalysisGetResult | null> {
    return super.getPost<AnalysisDocument, AnalysisGetResult>(
      UnitAnalysis.getCollection(mongoClient), seqId, langCode, incCount,
      ((post, isAltLang, otherLangs) => new AnalysisGetResult(post, isAltLang, otherLangs)),
    );
  }

  /**
   * Check if the given analysis ID is available.
   *
   * If ``seqId`` is omitted, returns ``true``.
   * (a new ID will be automatically generated and used when publishing an analysis without specifying it)
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} langCode analysis language code to be checked
   * @param {number} seqId analysis sequential ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the ID
   */
  static async isAnalysisIdAvailable(mongoClient: MongoClient, langCode: string, seqId?: number): Promise<boolean> {
    return super.isIdAvailable(
      AnalysisController,
      mongoClient,
      UnitAnalysis.getCollection(mongoClient),
      langCode,
      seqId,
    );
  }
}
