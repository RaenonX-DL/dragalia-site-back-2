import {Collection, MongoClient, ObjectId} from 'mongodb';
import {CollectionInfo} from '../../base/controller/info';
import {Document, DocumentBase, DocumentBaseKey} from '../../base/model/base';

export const dbInfo: CollectionInfo = {
  dbName: 'user',
  collectionName: 'google',
};

export enum GoogleUserDocumentKey {
  email = 'em',
  userId = 'uid',
  isAdmin = 'a',
  loginCount = 'lc',
  lastLogin = 'lr',
}

export type GoogleUserDocument = DocumentBase & {
  [GoogleUserDocumentKey.email]: string,
  [GoogleUserDocumentKey.userId]: string,
  [GoogleUserDocumentKey.isAdmin]: boolean,
  [GoogleUserDocumentKey.loginCount]: number,
  [GoogleUserDocumentKey.lastLogin]: Date
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
      [DocumentBaseKey.id]: this.id,
      [GoogleUserDocumentKey.email]: this.googleEmail,
      [GoogleUserDocumentKey.userId]: this.googleUid,
      [GoogleUserDocumentKey.isAdmin]: this.isAdmin,
      [GoogleUserDocumentKey.loginCount]: this.loginCount,
      [GoogleUserDocumentKey.lastLogin]: this.lastLogin,
    };
  }
}
