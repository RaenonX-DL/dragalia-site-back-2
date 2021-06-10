import {Collection, MongoClient, ObjectId} from 'mongodb';

import {CollectionInfo} from '../../base/controller/info';
import {Document, DocumentBase, DocumentBaseKey} from '../../base/model/base';


export const dbInfo: CollectionInfo = {
  dbName: 'user',
  collectionName: 'google',
};

export enum UserDocumentKey {
  email = 'em',
  userId = 'uid',
  isAdmin = 'a',
  adsFreeExpiry = 'ad',
  loginCount = 'lc',
  lastLogin = 'lr',
}

export type UserDocument = DocumentBase & {
  [UserDocumentKey.email]: string,
  [UserDocumentKey.userId]: string,
  [UserDocumentKey.isAdmin]: boolean,
  [UserDocumentKey.adsFreeExpiry]?: Date,
  [UserDocumentKey.loginCount]: number,
  [UserDocumentKey.lastLogin]: Date,
}

/**
 * A user data document.
 */
export class User extends Document {
  email: string;
  uid: string;
  isAdmin: boolean;
  adsFreeExpiry?: Date;
  loginCount: number;
  lastLogin: Date;

  isAdsFree: boolean;

  /**
   * Construct a user data.
   *
   * @param {string} email email of the account
   * @param {string} uid unique user ID of the account
   * @param {boolean} isAdmin if the user is a site admin
   * @param {Date} adsFreeExpiry date of the ads-free service expiry
   * @param {ObjectId} id document object ID
   * @param {number} loginCount user login count, default to 0
   * @param {Date} lastLogin last login time
   */
  constructor(
    email: string, uid: string, isAdmin: boolean, adsFreeExpiry?: Date,
    id?: ObjectId, loginCount?: number, lastLogin?: Date,
  ) {
    super({id});

    this.email = email;
    this.uid = uid;
    this.isAdmin = isAdmin;
    this.adsFreeExpiry = adsFreeExpiry;
    this.loginCount = loginCount || 0;
    this.lastLogin = lastLogin || new Date();

    this.isAdsFree = !!adsFreeExpiry;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: UserDocument): User {
    return new User(
      doc[UserDocumentKey.email],
      doc[UserDocumentKey.userId],
      doc[UserDocumentKey.isAdmin],
      doc[UserDocumentKey.adsFreeExpiry],
      doc[DocumentBaseKey.id],
      doc[UserDocumentKey.loginCount],
      doc[UserDocumentKey.lastLogin],
    );
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo, ((collection) => {
      collection.createIndex(UserDocumentKey.userId, {unique: true});
      collection.createIndex(UserDocumentKey.adsFreeExpiry, {expireAfterSeconds: 1});
    }));
  }

  /**
   * @inheritDoc
   */
  toObject(): UserDocument {
    return {
      [DocumentBaseKey.id]: this.id,
      [UserDocumentKey.email]: this.email,
      [UserDocumentKey.userId]: this.uid,
      [UserDocumentKey.isAdmin]: this.isAdmin,
      [UserDocumentKey.adsFreeExpiry]: this.adsFreeExpiry,
      [UserDocumentKey.loginCount]: this.loginCount,
      [UserDocumentKey.lastLogin]: this.lastLogin,
    };
  }
}
