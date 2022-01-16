import {MongoClient} from 'mongodb';

import {
  AnalysisBody,
  CharaAnalysisEditPayload,
  CharaAnalysisPublishPayload,
  DragonAnalysisEditPayload,
  DragonAnalysisPublishPayload,
  PostBodyBase,
  SupportedLanguages,
  UnitType,
} from '../../../api-def/api';
import {UpdateResult} from '../../../base/enum/updateResult';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {getUnitInfo} from '../../../utils/resources/loader/unitInfo';
import {getUnitIdByName} from '../../../utils/resources/loader/unitName2Id';
import {PostGetResult} from '../base/controller/get';
import {PostController} from '../base/controller/main';
import {AnalysisBodyWithInfo} from './base/response/types';
import {UnhandledUnitTypeError, UnitNotExistsError, UnitTypeMismatchError} from './error';
import {
  CharaAnalysis,
  CharaAnalysisDocument,
  CharaAnalysisDocumentKey,
  CharaAnalysisSkillDocument,
  CharaAnalysisSkillDocumentKey,
  DragonAnalysis,
  DragonAnalysisDocument,
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
   * @param {Array<SupportedLanguages>} otherLangs
   */
  constructor(post: AnalysisDocument, isAltLang: boolean, otherLangs: Array<SupportedLanguages>) {
    super(post, isAltLang, otherLangs);
  }

  /**
   * @inheritDoc
   */
  toResponseReady(): AnalysisBodyWithInfo {
    const base: PostBodyBase & AnalysisBody = {
      ...super.toResponseReady(),
      type: this.post[UnitAnalysisDocumentKey.type],
      unitId: this.post[UnitAnalysisDocumentKey.unitId],
      lang: this.post[MultiLingualDocumentKey.language],
      summary: this.post[UnitAnalysisDocumentKey.summary],
      summonResult: this.post[UnitAnalysisDocumentKey.summonResult],
      passives: this.post[UnitAnalysisDocumentKey.passives],
      normalAttacks: this.post[UnitAnalysisDocumentKey.normalAttacks],
      videos: this.post[UnitAnalysisDocumentKey.videos],
    };

    if (base.type === UnitType.CHARACTER) {
      const post = this.post as CharaAnalysisDocument;

      return {
        ...base,
        forceStrikes: post[CharaAnalysisDocumentKey.forceStrike],
        skills: post[CharaAnalysisDocumentKey.skills].map((doc: CharaAnalysisSkillDocument) => ({
          name: doc[CharaAnalysisSkillDocumentKey.name],
          info: doc[CharaAnalysisSkillDocumentKey.info],
          rotations: doc[CharaAnalysisSkillDocumentKey.rotations],
          tips: doc[CharaAnalysisSkillDocumentKey.tips],
        })),
        tipsBuilds: post[CharaAnalysisDocumentKey.tipsBuilds],
      };
    }

    if (base.type === UnitType.DRAGON) {
      const post = this.post as DragonAnalysisDocument;

      return {
        ...base,
        ultimate: post[DragonAnalysisDocumentKey.ultimate],
        notes: post[DragonAnalysisDocumentKey.notes],
        suitableCharacters: post[DragonAnalysisDocumentKey.suitableCharacters],
      };
    }

    throw new UnhandledUnitTypeError(+base.unitId, base.type);
  }
}

/**
 * Analysis controller.
 */
export class AnalysisController extends PostController {
  /**
   * Check if the unit is valid.
   *
   * The method will execute successfully if the unit exists and matches the expected type.
   * Otherwise, the corresponding error will be thrown.
   *
   * @param {number} unitId unit ID to be checked
   * @param {UnitType} expectedType expected unit type
   * @throws UnitNotExistsError if the unit does not exist
   * @throws UnitTypeMismatchError if the unit type is not the expected one
   * @return {Promise<void>}
   */
  static async checkUnitValid(unitId: number, expectedType: UnitType): Promise<void> {
    const unitInfo = await getUnitInfo(unitId);

    if (!unitInfo) {
      throw new UnitNotExistsError(unitId);
    } else if (unitInfo.type !== expectedType) {
      throw new UnitTypeMismatchError(unitId, expectedType, unitInfo.type);
    }
  }

  /**
   * Publish a new character analysis and return its unit ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CharaAnalysisPublishPayload} payload payload for creating a character analysis
   * @throws UnitNotExistsError if the unit does not exist using the unit ID in `payload`
   * @throws UnitTypeMismatchError if the unit type is not character
   * @return {Promise<number>} post unit ID
   */
  static async publishCharaAnalysis(
    mongoClient: MongoClient, payload: CharaAnalysisPublishPayload,
  ): Promise<number> {
    await AnalysisController.checkUnitValid(payload.unitId, UnitType.CHARACTER);

    const analysis: CharaAnalysis = CharaAnalysis.fromPayload(payload);

    await CharaAnalysis.getCollection(mongoClient).insertOne(analysis.toObject());

    return analysis.unitId;
  }

  /**
   * Publish a new dragon analysis and return its unit ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {DragonAnalysisPublishPayload} payload payload for creating a dragon analysis
   * @return {Promise<number>} post unit ID
   */
  static async publishDragonAnalysis(
    mongoClient: MongoClient, payload: DragonAnalysisPublishPayload,
  ): Promise<number> {
    await AnalysisController.checkUnitValid(payload.unitId, UnitType.DRAGON);

    const analysis: DragonAnalysis = DragonAnalysis.fromPayload(payload);

    await DragonAnalysis.getCollection(mongoClient).insertOne(analysis.toObject());

    return analysis.unitId;
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
      {
        [UnitAnalysisDocumentKey.unitId]: payload.unitId,
      },
      payload.lang,
      analysis.toObject(),
      payload.editNote,
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
      {
        [UnitAnalysisDocumentKey.unitId]: payload.unitId,
      },
      payload.lang,
      analysis.toObject(),
      payload.editNote,
    );
  }

  /**
   * Get a specific analysis.
   *
   * If this is called for analysis displaying purpose,
   * `incCount` should be `true`. Otherwise, it should be `false`.
   *
   * If `unitIdentifier` is a `string`, underscores will be treated as spaces.
   *
   * Returns the alternative language version
   * if the analysis of the given unit ID
   * in the specified language is not available,
   * but the version in the other language is available.
   *
   * Returns ``null`` if the post with the given unit ID is not found.
   *
   * The analysis which sequential ID matches ``unitIdentifier`` will also be returned for legacy usages.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string | number} unitIdentifier unit identifier of the post
   * @param {SupportedLanguages} lang language code of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @return {Promise<PostGetResult<QuestPostDocument>>} result of getting a quest post
   */
  static async getAnalysis(
    mongoClient: MongoClient, unitIdentifier: string | number, lang: SupportedLanguages, incCount = true,
  ): Promise<AnalysisGetResult | null> {
    // Convert string identifier to unit ID, if needed
    if (typeof unitIdentifier === 'string') {
      const unitId = await getUnitIdByName(unitIdentifier, mongoClient);

      if (!unitId) {
        return null;
      }

      unitIdentifier = unitId;
    }

    const collection = UnitAnalysis.getCollection(mongoClient);

    // Tries to get the analysis using `unitIdentifier` (indexed)
    const result = await super.getPost(
      collection,
      {[UnitAnalysisDocumentKey.unitId]: unitIdentifier},
      lang,
      incCount,
      (post, isAltLang, otherLangs) => (
        new AnalysisGetResult(post, isAltLang, otherLangs)
      ),
    );

    // Early return if found
    if (result) {
      return result;
    }

    // Otherwise, use sequential ID to get the analysis instead
    return super.getPost(
      collection,
      {[SequentialDocumentKey.sequenceId]: unitIdentifier},
      lang,
      incCount,
      (post, isAltLang, otherLangs) => (
        new AnalysisGetResult(post, isAltLang, otherLangs)
      ),
    );
  }

  /**
   * Check if the given unit ID has analysis available.
   *
   * This also check if the unit ID exists IRL.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang analysis language to be checked
   * @param {number} unitId unit ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the ID
   */
  static async isAnalysisIdAvailable(
    mongoClient: MongoClient,
    lang: SupportedLanguages,
    unitId: number,
  ): Promise<boolean> {
    if (!await getUnitInfo(unitId)) {
      return false;
    }

    return !await UnitAnalysis.getCollection(mongoClient)
      .findOne({
        [UnitAnalysisDocumentKey.unitId]: unitId,
        [MultiLingualDocumentKey.language]: lang,
      });
  }
}
