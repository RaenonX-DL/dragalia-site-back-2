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
  adsFreeExpiry = 'ad',
  loginCount = 'lc',
  lastLogin = 'lr',
}

export type GoogleUserDocument = DocumentBase & {
  [GoogleUserDocumentKey.email]: string,
  [GoogleUserDocumentKey.userId]: string,
  [GoogleUserDocumentKey.isAdmin]: boolean,
  [GoogleUserDocumentKey.adsFreeExpiry]?: Date,
  [GoogleUserDocumentKey.loginCount]: number,
  [GoogleUserDocumentKey.lastLogin]: Date,
}

/**
 * A Google user document.
 */
export class GoogleUser extends Document {
  googleEmail: string;
  googleUid: string;
  isAdmin: boolean;
  adsFreeExpiry?: Date;
  loginCount: number;
  lastLogin: Date;

  isAdsFree: boolean;

  /**
   * Construct a Google user document data.
   *
   * @param {string} googleEmail email of the google account
   * @param {string} googleUid unique user ID of the google account, this should consist of numbers
   * @param {boolean} isAdmin if the user is a site admin
   * @param {Date} adsFreeExpiry date of the ads-free service expiry
   * @param {ObjectId} id document object ID
   * @param {number} loginCount user login count, default to 0
   * @param {Date} lastLogin last login time
   */
  constructor(
    googleEmail: string, googleUid: string, isAdmin: boolean, adsFreeExpiry?: Date,
    id?: ObjectId, loginCount?: number, lastLogin?: Date,
  ) {
    super({id});

    this.googleEmail = googleEmail;
    this.googleUid = googleUid;
    this.isAdmin = isAdmin;
    this.adsFreeExpiry = adsFreeExpiry;
    this.loginCount = loginCount || 0;
    this.lastLogin = lastLogin || new Date();

    this.isAdsFree = !!adsFreeExpiry;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: GoogleUserDocument): GoogleUser {
    return new GoogleUser(doc.em, doc.uid, doc.a, doc.ad, doc._id, doc.lc, doc.lr);
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo, ((collection) => {
      collection.createIndex(GoogleUserDocumentKey.userId, {unique: true});
      collection.createIndex(GoogleUserDocumentKey.adsFreeExpiry, {expireAfterSeconds: 1});
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
      [GoogleUserDocumentKey.adsFreeExpiry]: this.adsFreeExpiry,
      [GoogleUserDocumentKey.loginCount]: this.loginCount,
      [GoogleUserDocumentKey.lastLogin]: this.lastLogin,
    };
  }
}
