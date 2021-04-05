import {MongoClient} from 'mongodb';
import {QuestPostEditPayload, QuestPostPublishPayload} from '../../../api-def/api';
import {NextSeqIdArgs} from '../../../base/controller/seq';
import {UpdateResult} from '../../../base/enum/updateResult';
import {ModifiableDocumentKey, ModifyNoteDocumentKey} from '../../../base/model/modifiable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {PostController, PostGetResult, PostListResult} from '../base/controller';
import {PostDocumentKey} from '../base/model';
import {QuestPostGetSuccessResponseParam} from './get/response';
import {dbInfo, QuestPositionDocumentKey, QuestPost, QuestPostDocument, QuestPostDocumentKey} from './model';


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
   * Same as {@link QuestPost.getNextSeqId}.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {number?} seqId desired post sequential ID to use
   * @param {boolean} increase increase the counter or not
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, {seqId, increase}: NextSeqIdArgs,
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
    payload = {...payload, seqId: await this.getNextSeqId(mongoClient, {seqId: payload.seqId})};

    const post: QuestPost = QuestPost.fromPayload(payload);

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

    return await this.editPost(
      QuestPost.getCollection(mongoClient),
      editPayload.seqId, editPayload.lang,
      post.toObject(), editPayload.modifyNote,
    );
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
  static async getQuestPost(
    mongoClient: MongoClient, seqId: number, langCode = 'cht', incCount = true,
  ): Promise<QuestPostGetResult | null> {
    return super.getPost<QuestPostDocument, QuestPostGetSuccessResponseParam, QuestPostGetResult>(
      QuestPost.getCollection(mongoClient), seqId, langCode, incCount,
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
   * @param {string} langCode post language code to be checked
   * @param {number} seqId post sequential ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the ID
   */
  static async isPostIdAvailable(mongoClient: MongoClient, langCode: string, seqId?: number): Promise<boolean> {
    return super.isIdAvailable(mongoClient, QuestPost.getCollection(mongoClient), langCode, seqId);
  }
}
