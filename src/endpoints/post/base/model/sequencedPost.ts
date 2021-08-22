import {Collection, MongoClient} from 'mongodb';

import {CollectionInfo} from '../../../../base/controller/info';
import {NextSeqIdOptions} from '../../../../base/controller/seq';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {
  SequentialDocument,
  SequentialDocumentBase,
  SequentialDocumentConstructParams,
  SequentialDocumentKey,
} from '../../../../base/model/seq';
import {IndexInitFunction} from '../../../../utils/mongodb';
import {PostConstructParamsNoTitle, PostDocumentBaseNoTitle, PostNoTitle} from './postNoTitle';


export enum PostDocumentKey {
  title = 't',
}

export type PostDocumentBase = PostDocumentBaseNoTitle & SequentialDocumentBase & {
  [PostDocumentKey.title]: string,
}

export type SequencedPostConstructParams =
  PostConstructParamsNoTitle &
  SequentialDocumentConstructParams & {
    title: string,
  }

/**
 * Sequenced post data class.
 */
export abstract class SequencedPost extends PostNoTitle implements SequentialDocument {
  seqId: number;
  title: string;

  /**
   * Construct a sequenced post data.
   *
   * @param {SequencedPostConstructParams} params parameters to construct a sequenced post
   */
  protected constructor(params: SequencedPostConstructParams) {
    super(params);

    this.seqId = params.seqId;
    this.title = params.title;
  }

  /**
   * Same as {@link SequentialDocument.getNextSeqId}.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {CollectionInfo} dbInfo collection info to use to get the next sequential ID
   * @param {NextSeqIdOptions} options options for getting the next sequential ID
   * @throws {SeqIdSkippingError} if the desired seqId to use is not sequential
   */
  static async getNextSeqId(
    mongoClient: MongoClient, dbInfo: CollectionInfo, options: NextSeqIdOptions,
  ): Promise<number> {
    return SequentialDocument.getNextSeqId(mongoClient, dbInfo, options);
  }

  /**
   * @inheritDoc
   */
  static getCollectionWithInfo(
    mongoClient: MongoClient, dbInfo: CollectionInfo, indexInitFunc?: IndexInitFunction,
  ): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo, ((collection) => {
      if (indexInitFunc) {
        indexInitFunc(collection);
      }
      collection.createIndex(
        [
          {[SequentialDocumentKey.sequenceId]: -1},
          {[MultiLingualDocumentKey.language]: 1},
        ],
        {unique: true},
      );
    }));
  }

  /**
   * @inheritDoc
   */
  toObject(): PostDocumentBase {
    return {
      ...super.toObject(),
      [SequentialDocumentKey.sequenceId]: this.seqId,
      [PostDocumentKey.title]: this.title,
    };
  }
}
