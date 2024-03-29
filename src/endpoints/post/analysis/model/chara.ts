import {UnitType, CharaAnalysisPayload} from '../../../../api-def/api';
import {CharaAnalysisSkill, CharaAnalysisSkillDocument} from './charaSkill';
import {UnitAnalysis, UnitAnalysisConstructParams, UnitAnalysisDocumentBase} from './unitAnalysis';


export enum CharaAnalysisDocumentKey {
  forceStrike = 'fs',
  skills = 'sk',
  tipsBuilds = 'tb',
}

export type CharaAnalysisDocument = UnitAnalysisDocumentBase & {
  [CharaAnalysisDocumentKey.forceStrike]: string,
  [CharaAnalysisDocumentKey.skills]: Array<CharaAnalysisSkillDocument>,
  [CharaAnalysisDocumentKey.tipsBuilds]: string,
};

export type CharaAnalysisConstructParams = Omit<UnitAnalysisConstructParams, 'type'> & {
  forceStrike: string,
  skills: Array<CharaAnalysisSkill>,
  tipsBuilds: string,
};

/**
 * Character analysis data class.
 */
export class CharaAnalysis extends UnitAnalysis {
  forceStrike: string;
  skills: Array<CharaAnalysisSkill>;
  tipsBuilds: string;

  /**
   * Construct a chara analysis data.
   *
   * @param {CharaAnalysisConstructParams} params parameters to construct a character analysis
   */
  constructor(params: CharaAnalysisConstructParams) {
    super({
      ...params,
      type: UnitType.CHARACTER,
    });

    this.forceStrike = params.forceStrike;
    this.skills = params.skills;
    this.tipsBuilds = params.tipsBuilds;
  }

  /**
   * Convert `payload` to a `CharaAnalysis`.
   *
   * @param {CharaAnalysisPayload} payload payload to be converted
   * @return {QuestPost} converted character analysis instance
   */
  static fromPayload<T extends CharaAnalysisPayload>(payload: T): CharaAnalysis {
    return new CharaAnalysis({
      ...super.fromPayloadToConstructParams(payload, UnitType.CHARACTER),
      forceStrike: payload.forceStrikes,
      skills: payload.skills.map((skill) => new CharaAnalysisSkill(skill)),
      tipsBuilds: payload.tipsBuilds,
    });
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: CharaAnalysisDocument): CharaAnalysis {
    return new CharaAnalysis(
      {
        ...super.fromDocumentToConstructParams(obj, UnitType.CHARACTER),
        forceStrike: obj[CharaAnalysisDocumentKey.forceStrike],
        skills: obj[CharaAnalysisDocumentKey.skills].map((doc) => CharaAnalysisSkill.fromDocument(doc)),
        tipsBuilds: obj[CharaAnalysisDocumentKey.tipsBuilds],
      },
    );
  }

  /**
   * @inheritDoc
   */
  toObject(): CharaAnalysisDocument {
    return {
      ...super.toObject(),
      [CharaAnalysisDocumentKey.forceStrike]: this.forceStrike,
      [CharaAnalysisDocumentKey.skills]: this.skills.map((obj) => obj.toObject()),
      [CharaAnalysisDocumentKey.tipsBuilds]: this.tipsBuilds,
    };
  }
}
