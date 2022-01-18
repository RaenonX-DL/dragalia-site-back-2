import {MongoClient} from 'mongodb';

import {
  EmailSendResult,
  PostType,
  QuestPostEditPayload,
  QuestPostPublishPayload,
  SequencedPostInfo, subKeysInclude, SubscriptionKey,
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
import {QuestGetResponse} from './get/response';
import {dbInfo, QuestPositionDocumentKey, QuestPost, QuestPostDocument, QuestPostDocumentKey} from './model';


/**
 * Result object of getting a quest post.
 */
class QuestPostGetResult extends PostGetResult<QuestPostDocument> {
  /**
   * Construct a quest post get result object.
   *
   * @param {PostGetResultOpts} options options to construct quest post get result
   */
  constructor(options: PostGetResultOpts<QuestPostDocument>) {
    super(options);
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
   * @param {NextSeqIdOptions} options options for getting the next sequential ID
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(mongoClient: MongoClient, options: NextSeqIdOptions): Promise<number> {
    return await QuestPost.getNextSeqId(mongoClient, dbInfo, options);
  }

  /**
   * Publish a new post and get its sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {QuestPostPublishPayload} payload payload for creating a quest post
   * @return {Promise<SequencedPublishResult>} post publish result
   */
  static async publishPost(
    mongoClient: MongoClient, payload: QuestPostPublishPayload,
  ): Promise<SequencedPublishResult> {
    const {seqId, lang} = payload;

    const post: QuestPost = QuestPost.fromPayload({
      ...payload,
      seqId: await QuestPostController.getNextSeqId(mongoClient, {seqId, lang}),
    });

    const [emailResult] = await Promise.all([
      SequencedController.sendPostPublishedEmail(mongoClient, lang, PostType.QUEST, post.seqId),
      (await QuestPost.getCollection(mongoClient)).insertOne(post.toObject()),
    ]);

    return {seqId: post.seqId, emailResult};
  }

  /**
   * Edit a quest post.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {QuestPostEditPayload} editPayload payload to edit a quest post
   * @return {Promise<SequencedEditResult>} result of editing a quest post
   */
  static async editQuestPost(
    mongoClient: MongoClient, editPayload: QuestPostEditPayload,
  ): Promise<SequencedEditResult> {
    const {lang, editNote} = editPayload;

    const post: QuestPost = QuestPost.fromPayload(editPayload);

    const updated = await QuestPostController.editPost(
      await QuestPost.getCollection(mongoClient),
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
    if (updated === 'UPDATED') {
      emailResult = await SequencedController.sendPostEditedEmail(
        mongoClient, lang, PostType.QUEST, post.seqId, editNote,
      );
    }

    return {
      seqId: post.seqId,
      updated,
      emailResult,
    };
  }

  /**
   * Get a list of quest posts.
   *
   * @param {ListPostOptions} options options for getting the misc post list
   * @return {Promise<PostListResult>} post listing result
   */
  static async getPostList(options: ListPostOptions): Promise<PostListResult<SequencedPostInfo>> {
    const {mongoClient, limit} = options;

    return QuestPostController.listPosts({
      ...options,
      postCollection: await QuestPost.getCollection(mongoClient),
      postType: PostType.QUEST,
      projection: {
        [SequentialDocumentKey.sequenceId]: 1,
        [PostDocumentKey.title]: 1,
      },
      globalSubscriptionKey: {type: 'const', name: 'ALL_QUEST'},
      transformFunc: (post, userSubscribed) => ({
        ...defaultTransformFunction(post, userSubscribed),
        seqId: post[SequentialDocumentKey.sequenceId],
        title: post[PostDocumentKey.title],
      }),
      limit,
    });
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
   * @param {GetSequentialPostOptions} options options to get a quest post
   * @return {Promise} result of getting a quest post
   */
  static async getQuestPost(options: GetSequentialPostOptions): Promise<QuestPostGetResult | null> {
    const {
      mongoClient,
      uid,
      seqId,
      lang = SupportedLanguages.CHT,
      incCount = true,
    } = options;

    return super.getPost<QuestPostDocument, QuestPostGetResult>({
      mongoClient,
      collection: await QuestPost.getCollection(mongoClient),
      uid,
      findCondition: {[SequentialDocumentKey.sequenceId]: seqId},
      resultConstructFunction: (options) => new QuestPostGetResult(options),
      isSubscribed: (key, post) => {
        const subKeys: SubscriptionKey[] = [
          {type: 'const', name: 'ALL_QUEST'},
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
      QuestPost.getCollection,
      QuestPostController.getNextSeqId,
      lang,
      seqId,
    );
  }
}
