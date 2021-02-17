import {MongoClient} from 'mongodb';
import {QuestPostPublishPayload} from '../../../api-def/api';
import {NextSeqIdArgs} from '../../../base/controller/seq';
import {ModifiableDocumentKey, ModifyNoteDocumentKey} from '../../../base/model/modifiable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {PostController, PostGetResult, PostListResult} from '../base/controller';
import {PostDocumentKey} from '../base/model';
import {QuestPostGetSuccessResponseParam} from './get/response';
import {
  dbInfo,
  QuestPosition,
  QuestPositionDocumentKey,
  QuestPost,
  QuestPostDocument,
  QuestPostDocumentKey,
} from './model';


/**
 * Result object of getting a quest post.
 */
class QuestPostGetResult extends PostGetResult<QuestPostDocument, QuestPostGetSuccessResponseParam> {
  /**
   * Construct a quest post get result object.
   *
   * @param {QuestPostDocument} post
   * @param {boolean} isAltLang
   * @param {Array<string>} otherLangs
   */
  constructor(post: QuestPostDocument, isAltLang: boolean, otherLangs: Array<string>) {
    super(post, isAltLang, otherLangs);
  }

  /**
   * @inheritDoc
   */
  toResponseReady(): QuestPostGetSuccessResponseParam {
    return {
      seqId: this.post[SequentialDocumentKey.sequenceId],
      lang: this.post[MultiLingualDocumentKey.language],
      title: this.post[PostDocumentKey.title],
      general: this.post[QuestPostDocumentKey.generalInfo],
      video: this.post[QuestPostDocumentKey.video],
      info: this.post[QuestPostDocumentKey.positionInfo].map((doc) => {
        return {
          position: doc[QuestPositionDocumentKey.position],
          builds: doc[QuestPositionDocumentKey.builds],
          rotations: doc[QuestPositionDocumentKey.rotations],
          tips: doc[QuestPositionDocumentKey.tips],
        };
      }),
      addendum: this.post[QuestPostDocumentKey.addendum],
      modifyNotes: this.post[ModifiableDocumentKey.modificationNotes].map((doc) => {
        return {
          timestamp: doc[ModifyNoteDocumentKey.datetime],
          note: doc[ModifyNoteDocumentKey.note],
        };
      }),
      isAltLang: this.isAltLang,
      otherLangs: this.otherLangs,
      viewCount: this.post[ViewCountableDocumentKey.viewCount],
      modified: this.post[ModifiableDocumentKey.dateModified],
      published: this.post[ModifiableDocumentKey.datePublished],
    };
  }
}

/**
 * Quest post controller.
 */
export class QuestPostController extends PostController {
  /**
   * Get the next available sequential ID.
   *
   * If ``seqId`` is specified, this method will return it and update it instead, if the number is valid.
   *
   * ``increase`` defaults to true.
   * If ``increase``, the counter will be increased and updated. The return will be the updated sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {number?} seqId post desired sequential ID to use, if any
   * @param {boolean} increase increase the counter or not
   * @return {Promise<number>} next available sequential ID
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, {seqId, increase}: NextSeqIdArgs,
  ): Promise<number> {
    if (increase == null) { // Check for both `null` and `undefined`
      increase = true;
    }

    return await QuestPost.getNextSeqId(mongoClient, dbInfo, {seqId, increase});
  }

  /**
   * Publish a new post and get its sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {QuestPostPublishPayload} postPayload quest post publishing payload for creating a post
   * @return {Promise<number>} post sequential ID
   */
  static async publishPost(mongoClient: MongoClient, postPayload: QuestPostPublishPayload): Promise<number> {
    const post: QuestPost = new QuestPost(
      await this.getNextSeqId(mongoClient, {seqId: postPayload.seqId}), postPayload.lang,
      postPayload.title, postPayload.general, postPayload.video,
      postPayload.positional.map(
        (posInfo) => new QuestPosition(posInfo.position, posInfo.builds, posInfo.rotations, posInfo.tips),
      ), postPayload.addendum,
    );

    await QuestPost.getCollection(mongoClient).insertOne(post.toObject());

    return post.seqId;
  }

  /**
   * Get a list of quest posts.
   *
   * @param {MongoClient} mongoClient mongo client to perform the listing
   * @param {string} langCode language code of the posts
   * @param {number} start starting index of the post lists
   * @param {number} limit maximum count of the posts to return
   * @return {Promise<PostListResult>} post listing result
   */
  static async getPostList(
    mongoClient: MongoClient, langCode: string, start = 0, limit = 0,
  ): Promise<PostListResult> {
    const projection = {
      [SequentialDocumentKey.sequenceId]: 1,
      [MultiLingualDocumentKey.language]: 1,
      [PostDocumentKey.title]: 1,
      [ModifiableDocumentKey.dateModified]: 1,
      [ModifiableDocumentKey.datePublished]: 1,
      [ViewCountableDocumentKey.viewCount]: 1,
    };

    return this.listPosts(QuestPost.getCollection(mongoClient), langCode, projection, start, limit, (post) => {
      return {
        seqId: post[SequentialDocumentKey.sequenceId],
        lang: post[MultiLingualDocumentKey.language],
        viewCount: post[ViewCountableDocumentKey.viewCount],
        modified: post[ModifiableDocumentKey.dateModified],
        published: post[ModifiableDocumentKey.datePublished],
      };
    });
  }

  /**
   * Get a specific quest post.
   *
   * If this is called for post displaying purpose, incCount should be ``true``. Otherwise, it should be ``false``.
   *
   * Returns the post in the alternative language if the given sequential ID
   * does not have the post in the specified language is not available,
   * but has the post in the other language available.
   *
   * Returns ``null`` if the post with the given sequential ID is not found.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {number} seqId sequential ID of the post
   * @param {string} langCode language code of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @return {Promise<PostGetResult<QuestPostDocument>>} result of getting a quest post
   */
  static async getQuestPost(
    mongoClient: MongoClient, seqId: number, langCode = 'cht', incCount = true,
  ): Promise<QuestPostGetResult | null> {
    return super.getPost<QuestPostDocument, QuestPostGetSuccessResponseParam, QuestPostGetResult>(
      QuestPost.getCollection(mongoClient), seqId, langCode, incCount,
      ((post, isAltLang, otherLangs) => new QuestPostGetResult(post, isAltLang, otherLangs)),
    );
  }
}
