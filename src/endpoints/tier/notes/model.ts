import {Collection, MongoClient} from 'mongodb';

import {
  DimensionKey,
  Ranking,
  SupportedLanguages,
  UnitTierNote as UnitTierNoteApi,
  TierNote as TierNoteApi,
} from '../../../api-def/api';
import {DocumentBase, DocumentBaseKey} from '../../../api-def/models';
import {CollectionInfo} from '../../../base/controller/info';
import {Document, DocumentConstructParams} from '../../../base/model/base';
import {getCurrentEpoch} from '../../../utils/misc';
import {TierNoteTraversalError} from './error';


const dbInfo: CollectionInfo = {
  dbName: 'tier',
  collectionName: 'notes',
};

export enum TierNoteEntryDocumentKey {
  ranking = 'r',
  note = 'n',
  isCompDependent = 'd',
}

export type TierNoteEntryDocument = {
  [TierNoteEntryDocumentKey.ranking]: Ranking,
  [TierNoteEntryDocumentKey.note]: { [lang in SupportedLanguages]?: string },
  [TierNoteEntryDocumentKey.isCompDependent]: boolean,
}

export type TierNoteConstructParams = {
  ranking: Ranking,
  note: { [lang in SupportedLanguages]?: string },
  isCompDependent: boolean,
}

/**
 * Tier note for a single dimension.
 */
export class TierNote extends Document {
  ranking: TierNoteConstructParams['ranking'];
  note: TierNoteConstructParams['note'];
  isCompDependent: TierNoteConstructParams['isCompDependent'];

  /**
   * Construct a tier note for a single dimension.
   *
   * @param {TierNoteConstructParams} params parameters to construct a single-dimension tier note
   */
  constructor(params: TierNoteConstructParams) {
    super();

    this.ranking = params.ranking;
    this.note = params.note;
    this.isCompDependent = params.isCompDependent;
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: TierNoteEntryDocument): TierNote {
    return new TierNote({
      ranking: doc[TierNoteEntryDocumentKey.ranking],
      note: doc[TierNoteEntryDocumentKey.note],
      isCompDependent: doc[TierNoteEntryDocumentKey.isCompDependent],
    });
  }

  /**
   * Convert this model to the format compliant with the API definition.
   *
   * @param {SupportedLanguages} lang language of the desired tier note
   * @return {TierNoteApi}
   */
  toApiFormat(lang: SupportedLanguages): TierNoteApi | null {
    let note;

    [lang, SupportedLanguages.CHT, SupportedLanguages.EN, SupportedLanguages.JP]
      .find((lang) => {
        note = this.note[lang];
        return !!note;
      });

    if (!note) {
      return null;
    }

    return {
      ranking: this.ranking,
      note,
      isCompDependent: this.isCompDependent,
    };
  }

  /**
   * @inheritDoc
   */
  toObject(): TierNoteEntryDocument {
    return {
      ...super.toObject(),
      [TierNoteEntryDocumentKey.ranking]: this.ranking,
      [TierNoteEntryDocumentKey.note]: this.note,
      [TierNoteEntryDocumentKey.isCompDependent]: this.isCompDependent,
    };
  }
}

export enum UnitTierNoteDocumentKey {
  unitId = 'u',
  points = 'p',
  tier = 't',
  lastUpdateEpoch = 'l',
}

export type UnitTierNoteDocument = DocumentBase & {
  [UnitTierNoteDocumentKey.unitId]: number,
  [UnitTierNoteDocumentKey.points]: Array<string>,
  [UnitTierNoteDocumentKey.tier]: { [dim in DimensionKey]?: TierNoteEntryDocument },
  [UnitTierNoteDocumentKey.lastUpdateEpoch]: number,
};

export type UnitTierNoteConstructParams = DocumentConstructParams & {
  unitId: number,
  points: Array<string>,
  tier: { [dim in DimensionKey]?: TierNote },
  lastUpdateEpoch: number,
}

/**
 * Unit tier note data class.
 */
export class UnitTierNote extends Document {
  unitId: UnitTierNoteConstructParams['unitId'];
  points: UnitTierNoteConstructParams['points'];
  tier: UnitTierNoteConstructParams['tier'];
  lastUpdateEpoch: UnitTierNoteConstructParams['lastUpdateEpoch'];

  /**
   * Construct a unit tier note data.
   *
   * @param {UnitTierNoteConstructParams} params parameters to construct a unit tier note data
   */
  constructor(params: UnitTierNoteConstructParams) {
    super(params);

    this.unitId = params.unitId;
    this.points = params.points;
    this.tier = params.tier;
    this.lastUpdateEpoch = params.lastUpdateEpoch;
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo);
  }

  /**
   * @inheritDoc
   */
  static fromDocument(doc: UnitTierNoteDocument): UnitTierNote {
    const constructParams: UnitTierNoteConstructParams = {
      unitId: doc[UnitTierNoteDocumentKey.unitId],
      points: doc[UnitTierNoteDocumentKey.points],
      tier: Object.fromEntries(
        Object.entries(doc[UnitTierNoteDocumentKey.tier])
          .map(([key, doc]) => [key, TierNote.fromDocument(doc as TierNoteEntryDocument)]),
      ),
      lastUpdateEpoch: doc[UnitTierNoteDocumentKey.lastUpdateEpoch],
    };

    // Only attach ID if needed
    if (doc[DocumentBaseKey.id]) {
      constructParams.id = doc[DocumentBaseKey.id];
    }

    return new UnitTierNote(constructParams);
  }

  /**
   * Create a unit tier note model from `tierNote`.
   *
   * @param {number} unitId unit ID of the tier note
   * @param {Omit<UnitTierNoteApi, 'lastUpdateEpoch'>} tierNote tier note data to construct the model
   * @param {SupportedLanguages} lang language of the tier note
   * @return {UnitTierNote}
   */
  static fromTierNote(
    unitId: number,
    tierNote: Omit<UnitTierNoteApi, 'lastUpdateEpoch'>,
    lang: SupportedLanguages,
  ): UnitTierNote {
    return new UnitTierNote({
      ...tierNote,
      unitId,
      tier: Object.fromEntries(Object.entries(tierNote.tier)
        .map(([dimension, tierNote]) => [
          dimension,
          new TierNote({...tierNote, note: {[lang]: tierNote.note}}),
        ]),
      ),
      lastUpdateEpoch: getCurrentEpoch(),
    });
  }

  /**
   * Transform the unit tier note document into an API-compliant format.
   *
   * @param {SupportedLanguages} lang language of the tier note
   * @return {UnitTierNoteApi} transformed document
   */
  toUnitTierNote(lang: SupportedLanguages): UnitTierNoteApi {
    return {
      points: this.points,
      tier: Object.fromEntries(Object.entries(this.tier).map(([key, tierNote]) => {
        const note = tierNote.toApiFormat(lang);

        if (!note) {
          throw new TierNoteTraversalError(key as DimensionKey, tierNote.note);
        }

        return [key, note];
      })),
      lastUpdateEpoch: this.lastUpdateEpoch,
    };
  }

  /**
   * @inheritDoc
   */
  toObject(): UnitTierNoteDocument {
    return {
      ...super.toObject(),
      [UnitTierNoteDocumentKey.unitId]: this.unitId,
      [UnitTierNoteDocumentKey.points]: this.points,
      [UnitTierNoteDocumentKey.tier]: Object.fromEntries(
        Object.entries(this.tier).map(([key, value]) => [key, value.toObject()]),
      ),
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: this.lastUpdateEpoch,
    };
  }
}
