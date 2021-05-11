import {Collection, MongoClient, ObjectId} from 'mongodb';

import {SupportedLanguages} from '../../../api-def/api';
import {CollectionInfo} from '../../../base/controller/info';
import {EditableDocumentBase, EditableDocumentKey, EditNote} from '../../../base/model/editable';
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
  & EditableDocumentBase
  & ViewCountableDocumentBase
  & {
  [PostDocumentKey.title]: string,
}

export type PostConstructParams = {
  seqId: number,
  language: SupportedLanguages,
  title: string,
  dateModifiedEpoch?: number,
  datePublishedEpoch?: number,
  id?: ObjectId,
  editNotes?: Array<EditNote>,
  viewCount?: number,
}

/**
 * Post data class.
 */
export abstract class Post extends SequentialDocument {
  language: SupportedLanguages;
  title: string;
  dateModifiedEpoch: number;
  datePublishedEpoch: number;
  editNotes: Array<EditNote>;
  viewCount: number;

  /**
   * Construct a post data.
   *
   * @param {PostConstructParams} params parameters to construct a post data
   */
  protected constructor(params: PostConstructParams) {
    super(params);

    const nowEpoch = new Date().valueOf();

    this.language = params.language;
    this.title = params.title;
    this.dateModifiedEpoch = params.dateModifiedEpoch || nowEpoch;
    this.datePublishedEpoch = params.dateModifiedEpoch || nowEpoch;
    this.editNotes = params.editNotes || [];
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
      [EditableDocumentKey.editNotes]: this.editNotes.map((doc) => doc.toObject()),
      [EditableDocumentKey.dateModifiedEpoch]: this.dateModifiedEpoch,
      [EditableDocumentKey.datePublishedEpoch]: this.datePublishedEpoch,
      [ViewCountableDocumentKey.viewCount]: this.viewCount,
    };
  }
}
