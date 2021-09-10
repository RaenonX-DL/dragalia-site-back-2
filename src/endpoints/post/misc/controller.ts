import {MongoClient} from 'mongodb';

import {
  MiscPostEditPayload,
  MiscPostPublishPayload,
  SequencedPostInfo,
  SupportedLanguages,
} from '../../../api-def/api';
import {NextSeqIdOptions, SequencedController} from '../../../base/controller/seq';
import {UpdateResult} from '../../../base/enum/updateResult';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {PostGetResult} from '../base/controller/get';
import {defaultTransformFunction, PostListResult} from '../base/controller/list';
import {PostController} from '../base/controller/main';
import {PostDocumentKey} from '../base/model';
import {MiscGetResponse} from './get/response';
import {dbInfo, MiscPost, MiscPostDocument, MiscPostDocumentKey, MiscSectionDocumentKey} from './model';


/**
 * Result object of getting a misc post.
 */
class MiscPostGetResult extends PostGetResult<MiscPostDocument> {
  /**
   * Construct a misc post get result object.
   *
   * @param {MiscPostDocument} post
   * @param {boolean} isAltLang
   * @param {Array<SupportedLanguages>} otherLangs
   */
  constructor(post: MiscPostDocument, isAltLang: boolean, otherLangs: Array<SupportedLanguages>) {
    super(post, isAltLang, otherLangs);
  }

  /**
   * @inheritDoc
   */
  toResponseReady(): MiscGetResponse {
    return {
      ...super.toResponseReady(),
      title: this.post[PostDocumentKey.title],
      seqId: this.post[SequentialDocumentKey.sequenceId],
      sections: this.post[MiscPostDocumentKey.sections].map((doc) => ({
        title: doc[MiscSectionDocumentKey.title],
        content: doc[MiscSectionDocumentKey.content],
      })),
    };
  }
}

/**
 * Misc post controller.
 */
export class MiscPostController extends PostController implements SequencedController {
  /**
   * Same as {@link MiscPost.getNextSeqId}.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {number?} seqId desired post sequential ID to use
   * @param {boolean} increase increase the counter or not
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, {seqId, increase}: NextSeqIdOptions,
  ): Promise<number> {
    return await MiscPost.getNextSeqId(mongoClient, dbInfo, {seqId, increase});
  }

  /**
   * Publish a new post and get its sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {QuestPostPublishPayload} payload payload for creating a misc post
   * @return {Promise<number>} post sequential ID
   */
  static async publishPost(mongoClient: MongoClient, payload: MiscPostPublishPayload): Promise<number> {
    const post: MiscPost = MiscPost.fromPayload({
      ...payload,
      seqId: await MiscPostController.getNextSeqId(mongoClient, {seqId: payload.seqId}),
    });

    await MiscPost.getCollection(mongoClient).insertOne(post.toObject());

    return post.seqId;
  }

  /**
   * Edit a misc post.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {MiscPostEditPayload} editPayload payload to edit a misc post
   * @return {Promise<UpdateResult>} result of editing a misc post
   */
  static async editMiscPost(mongoClient: MongoClient, editPayload: MiscPostEditPayload): Promise<UpdateResult> {
    const post: MiscPost = MiscPost.fromPayload(editPayload);

    return await MiscPostController.editPost(
      MiscPost.getCollection(mongoClient),
      {
        [SequentialDocumentKey.sequenceId]: editPayload.seqId,
      },
      editPayload.lang,
      post.toObject(),
      editPayload.editNote,
    );
  }

  /**
   * Get a list of misc posts.
   *
   * @param {MongoClient} mongoClient mongo client to perform the listing
   * @param {SupportedLanguages} lang language code of the posts
   * @return {Promise<PostListResult>} post listing result
   */
  static async getPostList(
    mongoClient: MongoClient, lang: SupportedLanguages,
  ): Promise<PostListResult<SequencedPostInfo>> {
    return MiscPostController.listPosts(
      MiscPost.getCollection(mongoClient),
      lang,
      {
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
   * Get a specific misc post.
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
   * @return {Promise} result of getting a misc post
   */
  static async getMiscPost(
    mongoClient: MongoClient, seqId: number, lang = SupportedLanguages.CHT, incCount = true,
  ): Promise<MiscPostGetResult | null> {
    return super.getPost<MiscPostDocument, MiscPostGetResult>(
      MiscPost.getCollection(mongoClient), {[SequentialDocumentKey.sequenceId]: seqId}, lang, incCount,
      ((post, isAltLang, otherLangs) => new MiscPostGetResult(post, isAltLang, otherLangs)),
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
      MiscPost.getCollection(mongoClient),
      MiscPostController.getNextSeqId,
      lang,
      seqId,
    );
  }
}
