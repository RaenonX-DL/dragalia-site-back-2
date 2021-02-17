import {MongoClient} from 'mongodb';
import {QuestPostPublishPayload} from '../../../api-def/api';
import {ModifiableDocumentKey} from '../../../base/model/modifiable';
import {MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {PostController, PostListResult} from '../base/controller';
import {PostDocumentKey} from '../base/model';
import {SeqIdSkippingError} from '../error';
import {dbInfo, QuestPosition, QuestPost} from './model';

/**
 * Quest post controller.
 */
export class QuestPostController extends PostController {
  /**
   * @inheritDoc
   */
  static async getNextSeqId(mongoClient: MongoClient, increase = true): Promise<number> {
    return await QuestPost.getNextSeqId(mongoClient, dbInfo, increase);
  }

  /**
   * Publish a new post and get its sequential ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {QuestPostPublishPayload} postPayload quest post publishing payload for creating a post
   * @return {Promise<number>} post sequential ID
   */
  static async publishPost(mongoClient: MongoClient, postPayload: QuestPostPublishPayload): Promise<number> {
    const latestSeqId = await this.getNextSeqId(mongoClient, false);

    if (postPayload.seqId && postPayload.seqId > latestSeqId + 1) {
      throw new SeqIdSkippingError(postPayload.seqId, latestSeqId + 1);
    }

    const post: QuestPost = new QuestPost(
      postPayload.seqId || await this.getNextSeqId(mongoClient), postPayload.lang,
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
}
