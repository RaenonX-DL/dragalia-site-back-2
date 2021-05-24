import {MongoClient} from 'mongodb';

import {
  SequencedPostMeta,
  QuestPostEditPayload,
  QuestPostPublishPayload,
  SupportedLanguages,
} from '../../../api-def/api';
import {NextSeqIdOptions, SequencedController} from '../../../base/controller/seq';
import {UpdateResult} from '../../../base/enum/updateResult';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {PostGetResult} from '../base/controller/get';
import {defaultTransformFunction, PostListResult} from '../base/controller/list';
import {PostController} from '../base/controller/main';
import {PostDocumentKey} from '../base/model';
import {QuestGetResponse} from './get/response';
import {dbInfo, QuestPositionDocumentKey, QuestPost, QuestPostDocument, QuestPostDocumentKey} from './model';


/**
 * Result object of getting a quest post.
 */
class QuestPostGetResult extends PostGetResult<QuestPostDocument> {
  /**
   * Construct a quest post get result object.
   *
   * @param {QuestPostDocument} post
   * @param {boolean} isAltLang
   * @param {Array<SupportedLanguages>} otherLangs
   */
  constructor(post: QuestPostDocument, isAltLang: boolean, otherLangs: Array<SupportedLanguages>) {
    super(post, isAltLang, otherLangs);
  }

  /**
   * @inheritDoc
   */
  toResponseReady(): QuestGetResponse {
    return {
      ...super.toResponseReady(),
      title: this.post[PostDocumentKey.title],
      seqId: this.post[SequentialDocumentKey.sequenceId],
      general: this.post[QuestPostDocumentKey.generalInfo],
      video: this.post[QuestPostDocumentKey.video],
      positional: this.post[QuestPostDocumentKey.positionInfo].map((doc) => ({
        position: doc[QuestPositionDocumentKey.position],
        builds: doc[QuestPositionDocumentKey.builds],
        rotations: doc[QuestPositionDocumentKey.rotations],
        tips: doc[QuestPositionDocumentKey.tips],
      })),
      addendum: this.post[QuestPostDocumentKey.addendum],
    };
  }
}

/**
 * Quest post controller.
 */
export class QuestPostController extends PostController implements SequencedController {
  /**
   * Same as {@link QuestPost.getNextSeqId}.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {number?} seqId desired post sequential ID to use
   * @param {boolean} increase increase the counter or not
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, {seqId, increase}: NextSeqIdOptions,
  ): Promise<number> {
    return await QuestPost.getNextSeqId(mongoClient, dbInfo, {seqId, increase});
  }

  /**
   * Publish a new post and get its sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {QuestPostPublishPayload} payload payload for creating a quest post
   * @return {Promise<number>} post sequential ID
   */
  static async publishPost(mongoClient: MongoClient, payload: QuestPostPublishPayload): Promise<number> {
    const post: QuestPost = QuestPost.fromPayload({
      ...payload,
      seqId: await QuestPostController.getNextSeqId(mongoClient, {seqId: payload.seqId}),
    });

    await QuestPost.getCollection(mongoClient).insertOne(post.toObject());

    return post.seqId;
  }

  /**
   * Edit a quest post.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {QuestPostEditPayload} editPayload payload to edit a quest post
   * @return {Promise<UpdateResult>} result of editing a quest post
   */
  static async editQuestPost(mongoClient: MongoClient, editPayload: QuestPostEditPayload): Promise<UpdateResult> {
    const post: QuestPost = QuestPost.fromPayload(editPayload);

    return await QuestPostController.editPost(
      QuestPost.getCollection(mongoClient),
      {
        [SequentialDocumentKey.sequenceId]: editPayload.seqId,
      },
      editPayload.lang,
      post.toObject(),
      editPayload.editNote,
    );
  }

  /**
   * Get a list of quest posts.
   *
   * @param {MongoClient} mongoClient mongo client to perform the listing
   * @param {SupportedLanguages} lang language code of the posts
   * @param {number} start starting index of the post lists
   * @param {number} limit maximum count of the posts to return
   * @return {Promise<PostListResult>} post listing result
   */
  static async getPostList(
    mongoClient: MongoClient, lang: SupportedLanguages, start = 0, limit = 0,
  ): Promise<PostListResult<SequencedPostMeta>> {
    return QuestPostController.listPosts(
      QuestPost.getCollection(mongoClient),
      lang,
      {
        start,
        limit,
        projection: {
          [SequentialDocumentKey.sequenceId]: 1,
          [PostDocumentKey.title]: 1,
        },
        transformFunc: (post) => ({
          ...defaultTransformFunction(post),
          seqId: post[SequentialDocumentKey.sequenceId],
          title: post[PostDocumentKey.title],
        }),
      },
    );
  }

  /**
   * Get a specific quest post.
   *
   * If this is called for post displaying purpose, incCount should be ``true``. Otherwise, it should be ``false``.
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
   * @param {SupportedLanguages} lang language of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @return {Promise} result of getting a quest post
   */
  static async getQuestPost(
    mongoClient: MongoClient, seqId: number, lang = SupportedLanguages.CHT, incCount = true,
  ): Promise<QuestPostGetResult | null> {
    return super.getPost<QuestPostDocument, QuestPostGetResult>(
      QuestPost.getCollection(mongoClient), {[SequentialDocumentKey.sequenceId]: seqId}, lang, incCount,
      ((post, isAltLang, otherLangs) => new QuestPostGetResult(post, isAltLang, otherLangs)),
    );
  }

  /**
   * Check if the given post ID is available.
   *
   * If ``seqId`` is omitted, returns ``true``.
   * (a new ID will be automatically generated and used when publishing a post without specifying it)
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {SupportedLanguages} lang post language to be checked
   * @param {number} seqId post sequential ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the ID
   */
  static async isPostIdAvailable(
    mongoClient: MongoClient,
    lang: SupportedLanguages,
    seqId?: number,
  ): Promise<boolean> {
    return SequencedController.isIdAvailable(
      mongoClient,
      QuestPost.getCollection(mongoClient),
      QuestPostController.getNextSeqId,
      lang,
      seqId,
    );
  }
}
