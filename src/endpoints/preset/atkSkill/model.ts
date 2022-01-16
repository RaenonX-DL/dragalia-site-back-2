import {Collection, MongoClient} from 'mongodb';

import {InputDataPreset} from '../../../api-def/api';
import {DocumentBase} from '../../../api-def/models';
import {CollectionInfo} from '../../../base/controller/info';
import {Document, DocumentConstructParams} from '../../../base/model/base';
import {getCollection} from '../../../utils/mongodb';


const dbInfo: CollectionInfo = {
  dbName: 'preset',
  collectionName: 'atkSkill',
};

export enum AtkSkillPresetDocumentKey {
  preset = 'p',
  lastUsed = 'u',
}

export type AtkSkillPresetDocument = DocumentBase & {
  [AtkSkillPresetDocumentKey.preset]: InputDataPreset,
  [AtkSkillPresetDocumentKey.lastUsed]: Date,
};
export type AtkSkillPresetConstructParams = DocumentConstructParams & {
  preset: InputDataPreset,
  lastUsed?: Date,
};

/**
 * ATK skill preset data class.
 */
export class AtkSkillPreset extends Document {
  preset: InputDataPreset;
  lastUsed: Date;

  /**
   * Construct an ATK skill preset data.
   *
   * @param {AtkSkillPresetConstructParams} params parameters to construct an ATK skill preset
   */
  constructor(params: AtkSkillPresetConstructParams) {
    super(params);

    this.preset = params.preset;
    this.lastUsed = params.lastUsed || new Date();
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection<AtkSkillPresetDocument> {
    return getCollection<AtkSkillPresetDocument>(mongoClient, dbInfo, ((collection) => {
      // Expire after 30 days
      collection.createIndex(AtkSkillPresetDocumentKey.lastUsed, {expireAfterSeconds: 30 * 86400});
    }));
  }

  /**
   * @inheritDoc
   */
  toObject(): AtkSkillPresetDocument {
    return {
      ...super.toObject(),
      [AtkSkillPresetDocumentKey.preset]: this.preset,
      [AtkSkillPresetDocumentKey.lastUsed]: this.lastUsed,
    };
  }
}
