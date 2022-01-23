import {MongoClient} from 'mongodb';

import {
  AnalysisBody,
  CharaAnalysisEditPayload,
  CharaAnalysisPublishPayload,
  DragonAnalysisEditPayload,
  DragonAnalysisPublishPayload,
  EmailSendResult,
  PostBodyBase,
  PostType, subKeysInclude,
  SubscriptionKey,
  SupportedLanguages,
  UnitType,
} from '../../../api-def/api';
import {makePostUrl, PostPath} from '../../../api-def/paths';
import {UpdateResult} from '../../../base/enum/updateResult';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {sendMailPostEdited} from '../../../thirdparty/mail/send/post/edited';
import {sendMailPostPublished} from '../../../thirdparty/mail/send/post/published';
import {getUnitInfo} from '../../../utils/resources/loader/unitInfo';
import {getUnitIdByName} from '../../../utils/resources/loader/unitName2Id';
import {PostGetResult, PostGetResultOpts} from '../base/controller/get';
import {PostController} from '../base/controller/main';
import {InternalGetPostOptions} from '../base/controller/type';
import {PostEditResultCommon} from '../base/type';
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
import {AnalysisPublishResult, GetAnalysisOptions} from './type';


/**
 * Result object of getting an analysis.
 */
class AnalysisGetResult extends PostGetResult<AnalysisDocument> {
  /**
   * Construct an analysis get result object.
   *
   * @param {PostGetResultOpts} options options to construct analysis get result
   */
  constructor(options: PostGetResultOpts<AnalysisDocument>) {
    super(options);
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
   * @return {Promise<AnalysisPublishResult>} post publishing result
   */
  static async publishCharaAnalysis(
    mongoClient: MongoClient, payload: CharaAnalysisPublishPayload,
  ): Promise<AnalysisPublishResult> {
    const {lang, unitId, sendUpdateEmail} = payload;

    await AnalysisController.checkUnitValid(unitId, UnitType.CHARACTER);

    const analysis: CharaAnalysis = CharaAnalysis.fromPayload(payload);

    const [emailResult] = await Promise.all([
      sendUpdateEmail ?
        AnalysisController.sendAnalysisPublishedEmail(mongoClient, lang, unitId) :
        Promise.resolve({accepted: [], rejected: []}),
      (await CharaAnalysis.getCollection(mongoClient)).insertOne(analysis.toObject()),
    ]);

    return {unitId: analysis.unitId, emailResult};
  }

  /**
   * Publish a new dragon analysis and return its unit ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {DragonAnalysisPublishPayload} payload payload for creating a dragon analysis
   * @return {Promise<AnalysisPublishResult>} post publishing result
   */
  static async publishDragonAnalysis(
    mongoClient: MongoClient, payload: DragonAnalysisPublishPayload,
  ): Promise<AnalysisPublishResult> {
    const {lang, unitId, sendUpdateEmail} = payload;

    await AnalysisController.checkUnitValid(unitId, UnitType.DRAGON);

    const analysis: DragonAnalysis = DragonAnalysis.fromPayload(payload);

    const [emailResult] = await Promise.all([
      sendUpdateEmail ?
        AnalysisController.sendAnalysisPublishedEmail(mongoClient, lang, unitId) :
        Promise.resolve({accepted: [], rejected: []}),
      (await DragonAnalysis.getCollection(mongoClient)).insertOne(analysis.toObject()),
    ]);

    return {unitId: analysis.unitId, emailResult};
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
  ): Promise<PostEditResultCommon> {
    const {lang, unitId, editNote, sendUpdateEmail} = payload;

    const analysis: CharaAnalysis = CharaAnalysis.fromPayload(payload);

    const updated = await AnalysisController.editPost(
      await CharaAnalysis.getCollection(mongoClient),
      {
        [UnitAnalysisDocumentKey.unitId]: payload.unitId,
      },
      payload.lang,
      analysis.toObject(),
      payload.editNote,
    );

    return {
      updated,
      emailResult: sendUpdateEmail ?
        await AnalysisController.sendAnalysisEditedEmail(mongoClient, lang, unitId, updated, editNote) :
        {accepted: [], rejected: []},
    };
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
  ): Promise<PostEditResultCommon> {
    const {lang, unitId, editNote, sendUpdateEmail} = payload;

    const analysis: DragonAnalysis = DragonAnalysis.fromPayload(payload);

    const updated = await AnalysisController.editPost(
      await DragonAnalysis.getCollection(mongoClient),
      {
        [UnitAnalysisDocumentKey.unitId]: payload.unitId,
      },
      payload.lang,
      analysis.toObject(),
      payload.editNote,
    );

    return {
      updated,
      emailResult: sendUpdateEmail ?
        await AnalysisController.sendAnalysisEditedEmail(mongoClient, lang, unitId, updated, editNote) :
        {accepted: [], rejected: []},
    };
  }

  /**
   * Sends an analysis published email.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the published analysis
   * @param {number} unitId unit ID of the published analysis
   * @return {Promise<EmailSendResult>} email send result
   * @private
   */
  private static async sendAnalysisPublishedEmail(
    mongoClient: MongoClient, lang: SupportedLanguages, unitId: number,
  ): Promise<EmailSendResult> {
    return sendMailPostPublished({
      mongoClient,
      lang,
      postType: PostType.ANALYSIS,
      sitePath: makePostUrl(PostPath.ANALYSIS, {lang, pid: unitId}),
      title: (await getUnitInfo(unitId))?.name[lang] || `#${unitId}`,
    });
  }

  /**
   * Sends an analysis edited email.
   *
   * Does not send any email if `updated` is not `UPDATED`.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang language of the edited analysis
   * @param {number} unitId unit ID of the edited analysis
   * @param {UpdateResult} updated analysis update result
   * @param {string} editNote analysis edit note
   * @return {Promise<EmailSendResult>} email send result
   * @private
   */
  private static async sendAnalysisEditedEmail(
    mongoClient: MongoClient,
    lang: SupportedLanguages,
    unitId: number,
    updated: UpdateResult,
    editNote: string,
  ): Promise<EmailSendResult> {
    if (updated !== 'UPDATED') {
      return {
        accepted: [],
        rejected: [],
      };
    }

    return sendMailPostEdited({
      mongoClient,
      lang,
      postType: PostType.ANALYSIS,
      postId: unitId,
      sitePath: makePostUrl(PostPath.ANALYSIS, {lang, pid: unitId}),
      title: (await getUnitInfo(unitId))?.name[lang] || `#${unitId}`,
      editNote: editNote,
    });
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
   * @param {GetAnalysisOptions} options options to get an analysis
   * @return {Promise<PostGetResult<QuestPostDocument>>} result of getting a quest post
   */
  static async getAnalysis(options: GetAnalysisOptions): Promise<AnalysisGetResult | null> {
    let {
      mongoClient,
      uid,
      unitIdentifier,
      lang = SupportedLanguages.CHT,
      incCount = true,
    } = options;

    // Convert string identifier to unit ID, if needed
    if (typeof unitIdentifier === 'string') {
      const unitId = await getUnitIdByName(unitIdentifier, mongoClient);

      if (!unitId) {
        return null;
      }

      unitIdentifier = unitId;
    }

    const collection = await UnitAnalysis.getCollection(mongoClient);

    const isSubscribed = (key: SubscriptionKey, analysis: AnalysisDocument): boolean => {
      const subKeys: SubscriptionKey[] = [
        {type: 'const', name: 'ALL_ANALYSIS'},
        {type: 'post', postType: PostType.ANALYSIS, id: analysis[UnitAnalysisDocumentKey.unitId]},
      ];

      return subKeysInclude(subKeys, key);
    };

    const getAnalysisOptions: InternalGetPostOptions<AnalysisDocument, AnalysisGetResult> = {
      mongoClient,
      collection,
      uid,
      findCondition: {[UnitAnalysisDocumentKey.unitId]: unitIdentifier},
      resultConstructFunction: (options) => new AnalysisGetResult(options),
      isSubscribed,
      lang,
      incCount,
    };

    // Tries to get the analysis using `unitIdentifier` (indexed)
    const result = await super.getPost(getAnalysisOptions);

    // Early return if found
    if (result) {
      return result;
    }

    // Otherwise, use sequential ID to get the analysis instead
    return super.getPost({
      ...getAnalysisOptions,
      findCondition: {[SequentialDocumentKey.sequenceId]: unitIdentifier},
    });
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

    return !await (await UnitAnalysis.getCollection(mongoClient))
      .findOne({
        [UnitAnalysisDocumentKey.unitId]: unitId,
        [MultiLingualDocumentKey.language]: lang,
      });
  }
}
