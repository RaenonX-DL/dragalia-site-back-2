import {Collection, MongoClient} from 'mongodb';

import {KeyPointType, KeyPointEntry as KeyPointEntryApi, SupportedLanguages} from '../../../api-def/api';
import {DocumentBase, DocumentBaseKey} from '../../../api-def/models';
import {CollectionInfo} from '../../../base/controller/info';
import {Document, DocumentConstructParams} from '../../../base/model/base';
import {getCollection} from '../../../utils/mongodb';
import {DescriptionTraversalError} from './error';


const dbInfo: CollectionInfo = {
  dbName: 'tier',
  collectionName: 'points',
};

export enum KeyPointEntryDocumentKey {
  type = 't',
  description = 'd',
}

export type KeyPointEntryDocument = DocumentBase & {
  [KeyPointEntryDocumentKey.type]: KeyPointType,
  [KeyPointEntryDocumentKey.description]: { [lang in SupportedLanguages]?: string },
};

export type KeyPointEntryConstructParams = DocumentConstructParams & {
  type: KeyPointEntryDocument[KeyPointEntryDocumentKey.type],
  description: KeyPointEntryDocument[KeyPointEntryDocumentKey.description],
};

/**
 * Key point entry class.
 */
export class KeyPointEntry extends Document {
  type: KeyPointEntryDocument[KeyPointEntryDocumentKey.type];
  description: KeyPointEntryDocument[KeyPointEntryDocumentKey.description];

  /**
   * Construct a key point entry.
   *
   * @param {KeyPointEntryConstructParams} params parameters to construct a key point entry
   */
  constructor(params: KeyPointEntryConstructParams) {
    super(params);

    this.type = params.type;
    this.description = params.description;
  }

  /**
   * @inheritDoc
   */
  static async getCollection(mongoClient: MongoClient): Promise<Collection<KeyPointEntryDocument>> {
    return await getCollection<KeyPointEntryDocument>(mongoClient, dbInfo);
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: KeyPointEntryDocument): KeyPointEntry {
    return new KeyPointEntry({
      id: doc[DocumentBaseKey.id],
      type: doc[KeyPointEntryDocumentKey.type],
      description: doc[KeyPointEntryDocumentKey.description],
    });
  }

  /**
   * Convert this entry model to an API-compliant object.
   *
   * Description will be in the given language.
   *
   * @param {SupportedLanguages} lang language of the description
   * @return {KeyPointEntry} transformed object
   */
  toEntry(lang: SupportedLanguages): KeyPointEntryApi {
    return {
      type: this.type,
      description: this.getDescription(lang),
    };
  }

  /**
   * Gets the description in `lang`.
   *
   * If the description in `lang` does not exist,
   * get the description in this priority order: `cht` > `en` > `jp`.
   *
   * @param {SupportedLanguages} lang desired language of the description
   * @return {string} description of the key point
   */
  getDescription(lang: SupportedLanguages): string {
    let description;

    [lang, SupportedLanguages.CHT, SupportedLanguages.EN, SupportedLanguages.JP]
      .find((lang) => {
        description = this.description[lang];
        return !!description;
      });

    if (!description) {
      throw new DescriptionTraversalError(this.description);
    }

    return description;
  }

  /**
   * @inheritDoc
   */
  toObject(): KeyPointEntryDocument {
    return {
      ...super.toObject(),
      [KeyPointEntryDocumentKey.type]: this.type,
      [KeyPointEntryDocumentKey.description]: this.description,
    };
  }
}
