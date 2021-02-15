import {MongoClient} from 'mongodb';
import {QuestPostPublishPayload} from '../../../api-def/api';
import {SequencedController} from '../../../base/controller';
import {SeqIdSkippingError} from '../error';
import {dbInfo, QuestPosition, QuestPost} from './model';

/**
 * Quest post controller.
 */
export class QuestPostController implements SequencedController {
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
}
