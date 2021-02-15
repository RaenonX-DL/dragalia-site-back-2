import {Collection, MongoClient, ObjectId} from 'mongodb';

import {CollectionInfo, Document, DocumentBase} from '../../base/model';

export const dbInfo: CollectionInfo = {
  dbName: 'user',
  collectionName: 'google',
};

export type GoogleUserDocument = DocumentBase & {
  em: string,
  uid: string,
  a: boolean,
  lc: number,
  lr: Date
}

/**
 * A Google user document.
 */
export class GoogleUser extends Document {
  googleEmail: string;
  googleUid: string;
  isAdmin: boolean;
  loginCount: number;
  lastLogin: Date;

  /**
   * Construct a Google user document data.
   *
   * @param {string} googleEmail email of the google account
   * @param {string} googleUid unique user ID of the google account, this should consist of numbers
   * @param {boolean} isAdmin if the user is a site admin
   * @param {ObjectId} id document object ID
   * @param {number} loginCount user login count, default to 0
   * @param {Date} lastLogin last login time
   */
  constructor(
    googleEmail: string, googleUid: string, isAdmin: boolean, id?: ObjectId, loginCount?: number, lastLogin?: Date,
  ) {
    super(id);

    this.googleEmail = googleEmail;
    this.googleUid = googleUid;
    this.isAdmin = isAdmin;
    this.loginCount = loginCount || 0;
    this.lastLogin = lastLogin || new Date();
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: GoogleUserDocument): GoogleUser {
    return new GoogleUser(doc.em, doc.uid, doc.a, doc._id, doc.lc, doc.lr);
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo, ((collection) => {
      collection.createIndex('uid', {unique: true});
    }));
  }

  /**
   * @inheritDoc
   */
  toObject(): GoogleUserDocument {
    return {
      _id: this.id,
      em: this.googleEmail,
      uid: this.googleUid,
      a: this.isAdmin,
      lc: this.loginCount,
      lr: this.lastLogin,
    };
  }
}
