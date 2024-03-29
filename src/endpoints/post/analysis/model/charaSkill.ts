import {Collection, MongoClient} from 'mongodb';

import {DocumentBaseKey} from '../../../../api-def/models';
import {Document} from '../../../../base/model/base';
import {getCollection} from '../../../../utils/mongodb';
import {dbInfo} from './config';


export enum CharaAnalysisSkillDocumentKey {
  name = 'n',
  info = 'i',
  rotations = 'rt',
  tips = 'ts',
}

export type CharaAnalysisSkillDocument = {
  [DocumentBaseKey.id]?: never,
  [CharaAnalysisSkillDocumentKey.name]: string,
  [CharaAnalysisSkillDocumentKey.info]: string,
  [CharaAnalysisSkillDocumentKey.rotations]: string,
  [CharaAnalysisSkillDocumentKey.tips]: string,
};

export type CharaAnalysisSkillConstructParams = {
  name: string,
  info: string,
  rotations: string,
  tips: string,
};

/**
 * Character analysis skill data class.
 */
export class CharaAnalysisSkill extends Document {
  name: string;
  info: string;
  rotations: string;
  tips: string;

  /**
   * Construct a character analysis skill data.
   *
   * @param {CharaAnalysisSkillConstructParams} _ parameters to construct a character analysis skill entry
   */
  constructor({name, info, rotations, tips}: CharaAnalysisSkillConstructParams) {
    super();

    this.name = name;
    this.info = info;
    this.rotations = rotations;
    this.tips = tips;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: CharaAnalysisSkillDocument): CharaAnalysisSkill {
    return new CharaAnalysisSkill(
      {
        name: obj[CharaAnalysisSkillDocumentKey.name],
        info: obj[CharaAnalysisSkillDocumentKey.info],
        rotations: obj[CharaAnalysisSkillDocumentKey.rotations],
        tips: obj[CharaAnalysisSkillDocumentKey.tips],
      },
    );
  }

  /**
   * @inheritDoc
   */
  static async getCollection(mongoClient: MongoClient): Promise<Collection<CharaAnalysisSkillDocument>> {
    return await getCollection<CharaAnalysisSkillDocument>(mongoClient, dbInfo);
  }

  /**
   * @inheritDoc
   */
  toObject(): CharaAnalysisSkillDocument {
    return {
      [CharaAnalysisSkillDocumentKey.name]: this.name,
      [CharaAnalysisSkillDocumentKey.info]: this.info,
      [CharaAnalysisSkillDocumentKey.rotations]: this.rotations,
      [CharaAnalysisSkillDocumentKey.tips]: this.tips,
    };
  }
}
