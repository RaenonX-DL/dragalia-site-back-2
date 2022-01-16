import {Collection, MongoClient, ObjectId} from 'mongodb';

import {AUTH_DB, AUTH_USER_COLLECTION, UserDocument, UserDocumentKey, DocumentBaseKey} from '../../api-def/models';
import {CollectionInfo} from '../../base/controller/info';
import {Document} from '../../base/model/base';
import {getCollection} from '../../utils/mongodb';


type UserConstructOptions = UserDocument;

export const dbInfo: CollectionInfo = {
  dbName: AUTH_DB,
  collectionName: AUTH_USER_COLLECTION,
};

/**
 * A user data.
 */
export class User extends Document {
  uid: ObjectId;

  name: string;
  email: string;
  image: string;
  isAdmin: boolean;

  createdAt: Date;
  updatedAt: Date;
  adsFreeExpiry?: Date;

  isAdsFree: boolean;

  /**
   * Construct a user data.
   *
   * @param {UserConstructOptions} options options to construct a user data
   */
  constructor(options: UserConstructOptions) {
    super({id: options[DocumentBaseKey.id]});

    this.uid = this.id || new ObjectId();

    this.name = options[UserDocumentKey.name];
    this.email = options[UserDocumentKey.email];
    this.image = options[UserDocumentKey.image];
    this.isAdmin = options[UserDocumentKey.isAdmin];

    this.createdAt = options[UserDocumentKey.createdAt];
    this.updatedAt = options[UserDocumentKey.updatedAt];
    this.adsFreeExpiry = options[UserDocumentKey.adsFreeExpiry];

    this.isAdsFree = !!this.adsFreeExpiry;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: UserDocument): User {
    return new User(doc);
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection<UserDocument> {
    return getCollection<UserDocument>(mongoClient, dbInfo);
  }

  /**
   * @inheritDoc
   */
  toObject(): UserDocument {
    return {
      [DocumentBaseKey.id]: this.id,
      [UserDocumentKey.name]: this.name,
      [UserDocumentKey.email]: this.email,
      [UserDocumentKey.image]: this.image,
      [UserDocumentKey.isAdmin]: this.isAdmin,
      [UserDocumentKey.createdAt]: this.createdAt,
      [UserDocumentKey.updatedAt]: this.updatedAt,
      [UserDocumentKey.adsFreeExpiry]: this.adsFreeExpiry,
    };
  }
}
