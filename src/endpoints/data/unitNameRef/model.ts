import {Collection, MongoClient} from 'mongodb';

import {SupportedLanguages} from '../../../api-def/api';
import {DocumentBase} from '../../../api-def/models';
import {CollectionInfo} from '../../../base/controller/info';
import {Document, DocumentConstructParams} from '../../../base/model/base';
import {MultiLingualDocumentBase, MultiLingualDocumentKey} from '../../../base/model/multiLang';
import {getCollection} from '../../../utils/mongodb';


const dbInfo: CollectionInfo = {
  dbName: 'data',
  collectionName: 'unitName',
};

export enum UnitNameRefEntryDocumentKey {
  name = 'n',
  unitId = 'u',
}

export type UnitNameRefEntryDocument = DocumentBase & MultiLingualDocumentBase & {
  [UnitNameRefEntryDocumentKey.name]: string,
  [UnitNameRefEntryDocumentKey.unitId]: number,
};

export type UnitNameRefEntryConstructParams = DocumentConstructParams & {
  lang: SupportedLanguages,
  name: string,
  unitId: number,
};

/**
 * Unit name reference entry class.
 */
export class UnitNameRefEntry extends Document {
  lang: SupportedLanguages;
  name: string;
  unitId: number;

  /**
   * Construct a unit name reference entry
   *
   * @param {UnitNameRefEntryConstructParams} params parameters to construct a unit name ref entry
   */
  constructor(params: UnitNameRefEntryConstructParams) {
    super(params);

    this.lang = params.lang;
    this.name = params.name;
    this.unitId = params.unitId;
  }

  /**
   * @inheritDoc
   */
  static async getCollection(mongoClient: MongoClient): Promise<Collection<UnitNameRefEntryDocument>> {
    return await getCollection<UnitNameRefEntryDocument>(mongoClient, dbInfo, async (collection) => {
      await Promise.all([
        collection.createIndex(MultiLingualDocumentKey.language),
        collection.createIndex(
          [UnitNameRefEntryDocumentKey.name, MultiLingualDocumentKey.language],
          {unique: true},
        ),
      ]);
    });
  }

  /**
   * @inheritDoc
   */
  toObject(): UnitNameRefEntryDocument {
    return {
      ...super.toObject(),
      [MultiLingualDocumentKey.language]: this.lang,
      [UnitNameRefEntryDocumentKey.name]: this.name,
      [UnitNameRefEntryDocumentKey.unitId]: this.unitId,
    };
  }
}
