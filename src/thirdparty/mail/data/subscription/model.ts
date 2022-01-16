import {Collection, MongoClient, ObjectId} from 'mongodb';

import {DocumentBase} from '../../../../api-def/models';
import {CollectionInfo} from '../../../../base/controller/info';
import {Document} from '../../../../base/model/base';
import {getCollection} from '../../../../utils/mongodb';
import {SubscriptionKey} from './key';


const dbInfo: CollectionInfo = {
  dbName: 'email',
  collectionName: 'subscription',
};

export enum SubscriptionRecordDocumentKey {
  key = 'k',
  uid = 'u',
}

export type SubscriptionRecordDocument = DocumentBase & {
  [SubscriptionRecordDocumentKey.key]: SubscriptionKey,
  [SubscriptionRecordDocumentKey.uid]: ObjectId,
};

export type SubscriptionRecordConstructParams = {
  key: SubscriptionKey,
  uid: ObjectId,
};

/**
 * Email subscription record class.
 */
export class SubscriptionRecord extends Document {
  key: SubscriptionKey;
  uid: ObjectId;

  /**
   * Construct a subscription record.
   *
   * @param {SubscriptionRecordConstructParams} params parameters to construct a subscription record
   */
  constructor(params: SubscriptionRecordConstructParams) {
    super();

    this.key = params.key;
    this.uid = params.uid;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: SubscriptionRecordDocument): SubscriptionRecord {
    return new SubscriptionRecord(
      {
        key: obj[SubscriptionRecordDocumentKey.key],
        uid: obj[SubscriptionRecordDocumentKey.uid],
      },
    );
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection<SubscriptionRecordDocument> {
    return getCollection<SubscriptionRecordDocument>(mongoClient, dbInfo, ((collection) => {
      // For preventing duplicated entries
      collection.createIndex(
        [SubscriptionRecordDocumentKey.key, SubscriptionRecordDocumentKey.uid],
        {unique: true},
      );
    }));
  }

  /**
   * @inheritDoc
   */
  toObject(): SubscriptionRecordDocument {
    return {
      ...super.toObject(),
      [SubscriptionRecordDocumentKey.key]: this.key,
      [SubscriptionRecordDocumentKey.uid]: this.uid,
    };
  }
}
