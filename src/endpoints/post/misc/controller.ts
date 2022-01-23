import {MongoClient} from 'mongodb';

import {
  EmailSendResult,
  MiscPostEditPayload,
  MiscPostPublishPayload,
  PostType,
  SequencedPostInfo,
  subKeysInclude,
  SubscriptionKey,
  SupportedLanguages,
} from '../../../api-def/api';
import {NextSeqIdOptions, SequencedController} from '../../../base/controller/seq';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {PostGetResult, PostGetResultOpts} from '../base/controller/get';
import {defaultTransformFunction, PostListResult} from '../base/controller/list';
import {PostController} from '../base/controller/main';
import {GetSequentialPostOptions, ListPostOptions} from '../base/controller/type';
import {PostDocumentKey} from '../base/model';
import {SequencedEditResult, SequencedPublishResult} from '../base/type';
import {MiscGetResponse} from './get/response';
import {dbInfo, MiscPost, MiscPostDocument, MiscPostDocumentKey, MiscSectionDocumentKey} from './model';


/**
 * Result object of getting a misc post.
 */
class MiscPostGetResult extends PostGetResult<MiscPostDocument> {
  /**
   * Construct a misc post get result object.
   *
   * @param {PostGetResultOpts} options options to construct misc post get result
   */
  constructor(options: PostGetResultOpts<MiscPostDocument>) {
    super(options);
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
   * @param {NextSeqIdOptions} options options for getting the next sequential ID
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(mongoClient: MongoClient, options: NextSeqIdOptions): Promise<number> {
    return await MiscPost.getNextSeqId(mongoClient, dbInfo, options);
  }

  /**
   * Publish a new post and get its sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {QuestPostPublishPayload} payload payload for creating a misc post
   * @return {Promise<SequencedPublishResult>} post publish result
   */
  static async publishPost(
    mongoClient: MongoClient, payload: MiscPostPublishPayload,
  ): Promise<SequencedPublishResult> {
    const {seqId, lang, sendUpdateEmail} = payload;

    const post: MiscPost = MiscPost.fromPayload({
      ...payload,
      seqId: await MiscPostController.getNextSeqId(mongoClient, {seqId, lang}),
    });

    const [emailResult] = await Promise.all([
      sendUpdateEmail ?
        SequencedController.sendPostPublishedEmail(mongoClient, lang, PostType.MISC, post.seqId) :
        Promise.resolve({accepted: [], rejected: []}),
      (await MiscPost.getCollection(mongoClient)).insertOne(post.toObject()),
    ]);

    return {seqId: post.seqId, emailResult};
  }

  /**
   * Edit a misc post.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {MiscPostEditPayload} editPayload payload to edit a misc post
   * @return {Promise<SequencedEditResult>} result of editing a misc post
   */
  static async editMiscPost(mongoClient: MongoClient, editPayload: MiscPostEditPayload): Promise<SequencedEditResult> {
    const {lang, editNote, sendUpdateEmail} = editPayload;

    const post: MiscPost = MiscPost.fromPayload(editPayload);

    const updated = await MiscPostController.editPost(
      await MiscPost.getCollection(mongoClient),
      {
        [SequentialDocumentKey.sequenceId]: editPayload.seqId,
      },
      lang,
      post.toObject(),
      editPayload.editNote,
    );

    let emailResult: EmailSendResult = {
      accepted: [],
      rejected: [],
    };
    if (updated === 'UPDATED' && sendUpdateEmail) {
      emailResult = await SequencedController.sendPostEditedEmail(
        mongoClient, lang, PostType.MISC, post.seqId, editNote,
      );
    }

    return {
      seqId: post.seqId,
      updated,
      emailResult,
    };
  }

  /**
   * Get a list of misc posts.
   *
   * @param {ListPostOptions} options options for getting the misc post list
   * @return {Promise<PostListResult>} post listing result
   */
  static async getPostList(options: ListPostOptions): Promise<PostListResult<SequencedPostInfo>> {
    const {mongoClient, limit} = options;

    return MiscPostController.listPosts({
      ...options,
      postCollection: await MiscPost.getCollection(mongoClient),
      postType: PostType.MISC,
      projection: {
        [SequentialDocumentKey.sequenceId]: 1,
        [PostDocumentKey.title]: 1,
      },
      globalSubscriptionKey: {type: 'const', name: 'ALL_MISC'},
      transformFunc: (post, userSubscribed) => ({
        ...defaultTransformFunction(post, userSubscribed),
        seqId: post[SequentialDocumentKey.sequenceId],
        title: post[PostDocumentKey.title],
      }),
      limit,
    });
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
   * @param {GetSequentialPostOptions} options options to get a misc post
   * @return {Promise} result of getting a misc post
   */
  static async getMiscPost(options: GetSequentialPostOptions): Promise<MiscPostGetResult | null> {
    const {
      mongoClient,
      uid,
      seqId,
      lang = SupportedLanguages.CHT,
      incCount = true,
    } = options;

    return super.getPost<MiscPostDocument, MiscPostGetResult>({
      mongoClient,
      collection: await MiscPost.getCollection(mongoClient),
      uid,
      findCondition: {[SequentialDocumentKey.sequenceId]: seqId},
      resultConstructFunction: (options) => new MiscPostGetResult(options),
      isSubscribed: (key, post) => {
        const subKeys: SubscriptionKey[] = [
          {type: 'const', name: 'ALL_MISC'},
          {type: 'post', postType: PostType.ANALYSIS, id: post[SequentialDocumentKey.sequenceId]},
        ];

        return subKeysInclude(subKeys, key);
      },
      lang,
      incCount,
    });
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
      MiscPost.getCollection,
      MiscPostController.getNextSeqId,
      lang,
      seqId,
    );
  }
}
