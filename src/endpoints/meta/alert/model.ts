import {Collection, MongoClient} from 'mongodb';

import {AlertEntry as AlertEntryApi, AlertVariant, SupportedLanguages} from '../../../api-def/api';
import {DocumentBaseKey} from '../../../api-def/models';
import {CollectionInfo} from '../../../base/controller/info';
import {Document} from '../../../base/model/base';
import {MultiLingualDocumentBase, MultiLingualDocumentKey} from '../../../base/model/multiLang';


export const dbInfo: CollectionInfo = {
  dbName: 'site',
  collectionName: 'alert',
};

export enum AlertEntryKey {
  message = 'm',
  variant = 'v'
}

export type AlertEntryDocument = MultiLingualDocumentBase & {
  [AlertEntryKey.message]: string,
  [AlertEntryKey.variant]: AlertVariant,
}

type AlertEntryConstructOptions = AlertEntryApi & {
  lang: SupportedLanguages,
}

/**
 * Class of a site alert entry.
 */
export class AlertEntry extends Document {
  lang: SupportedLanguages;
  variant: AlertVariant;
  message: string;

  /**
   * Construct a site alert entry.
   *
   * @param {AlertEntryConstructOptions} options options to construct a site alert
   */
  constructor(options: AlertEntryConstructOptions) {
    super();

    this.lang = options.lang;
    this.message = options.message;
    this.variant = options.variant;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: AlertEntryDocument): AlertEntry {
    return new AlertEntry({
      lang: doc[MultiLingualDocumentKey.language],
      message: doc[AlertEntryKey.message],
      variant: doc[AlertEntryKey.variant],
    });
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo);
  }

  /**
   * Convert the current entry class instance to API-compliant object.
   *
   * @return {AlertEntryApi} API-compliant entry object
   */
  toApiEntry(): AlertEntryApi {
    return {
      message: this.message,
      variant: this.variant,
    };
  }

  /**
   * @inheritDoc
   */
  toObject(): AlertEntryDocument {
    return {
      [DocumentBaseKey.id]: this.id,
      [MultiLingualDocumentKey.language]: this.lang,
      [AlertEntryKey.message]: this.message,
      [AlertEntryKey.variant]: this.variant,
    };
  }
}
