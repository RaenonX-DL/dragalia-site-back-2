import {Collection, MongoClient, ObjectId} from 'mongodb';

import {CollectionInfo} from '../../../base/controller/info';
import {ModifiableDocumentBase, ModifiableDocumentKey, ModifyNote} from '../../../base/model/modifiable';
import {MultiLingualDocumentBase, MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {SequentialDocument, SequentialDocumentBase, SequentialDocumentKey} from '../../../base/model/seq';
import {ViewCountableDocumentBase, ViewCountableDocumentKey} from '../../../base/model/viewCount';
import {IndexInitFunction} from '../../../utils/mongodb';

export enum PostDocumentKey {
  title = 't',
}

export type PostDocumentBase =
  MultiLingualDocumentBase
  & SequentialDocumentBase
  & ModifiableDocumentBase
  & ViewCountableDocumentBase
  & {
  [PostDocumentKey.title]: string,
}

export type PostConstructParams = {
  seqId: number,
  language: string,
  title: string,
  dateModified?: Date,
  datePublished?: Date,
  id?: ObjectId,
  modificationNotes?: Array<ModifyNote>,
  viewCount?: number,
}

/**
 * Post data class.
 */
export abstract class Post extends SequentialDocument {
  language: string;
  title: string;
  dateModified: Date;
  datePublished: Date;
  modificationNotes: Array<ModifyNote>;
  viewCount: number;

  /**
   * Construct a post data.
   *
   * @param {PostConstructParams} params parameters to construct a post data
   */
  protected constructor(params: PostConstructParams) {
    super(params);

    const now = new Date();

    this.language = params.language;
    this.title = params.title;
    this.dateModified = params.dateModified || now;
    this.datePublished = params.dateModified || now;
    this.modificationNotes = params.modificationNotes || [];
    this.viewCount = params.viewCount || 0;
  }

  /**
   * @inheritDoc
   */
  protected static getCollectionWithInfo(
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
      [MultiLingualDocumentKey.language]: this.language,
      [PostDocumentKey.title]: this.title,
      [ModifiableDocumentKey.modificationNotes]: this.modificationNotes.map((doc) => doc.toObject()),
      [ModifiableDocumentKey.dateModified]: this.dateModified,
      [ModifiableDocumentKey.datePublished]: this.datePublished,
      [ViewCountableDocumentKey.viewCount]: this.viewCount,
    };
  }
}
