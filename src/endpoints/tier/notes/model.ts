import {Collection, MongoClient} from 'mongodb';

import {DimensionKey, Ranking, SupportedLanguages, UnitTierNote as UnitTierNoteApi} from '../../../api-def/api';
import {DocumentBase, DocumentBaseKey} from '../../../api-def/models';
import {CollectionInfo} from '../../../base/controller/info';
import {Document, DocumentConstructParams} from '../../../base/model/base';
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
  tier: { [dim in DimensionKey]?: TierNoteConstructParams },
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
    return new UnitTierNote({
      id: doc[DocumentBaseKey.id],
      unitId: doc[UnitTierNoteDocumentKey.unitId],
      points: doc[UnitTierNoteDocumentKey.points],
      tier: Object.fromEntries(
        Object.entries(doc[UnitTierNoteDocumentKey.tier])
          .map(([key, doc]) => {
            const tierNote: TierNoteConstructParams = {
              note: doc[TierNoteEntryDocumentKey.note],
              ranking: doc[TierNoteEntryDocumentKey.ranking],
              isCompDependent: doc[TierNoteEntryDocumentKey.isCompDependent],
            };

            return [key, tierNote];
          }),
      ),
      lastUpdateEpoch: doc[UnitTierNoteDocumentKey.lastUpdateEpoch],
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
        let note;

        [lang, SupportedLanguages.CHT, SupportedLanguages.EN, SupportedLanguages.JP]
          .find((lang) => {
            note = tierNote.note[lang];
            return !!note;
          });

        if (!note) {
          throw new TierNoteTraversalError(key as DimensionKey, tierNote.note);
        }

        return [key, {...tierNote, note}];
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
        Object.entries(this.tier).map(([key, value]) => {
          const tierNoteDoc: TierNoteEntryDocument = {
            [TierNoteEntryDocumentKey.note]: value.note,
            [TierNoteEntryDocumentKey.ranking]: value.ranking,
            [TierNoteEntryDocumentKey.isCompDependent]: value.isCompDependent,
          };

          return [key, tierNoteDoc];
        }),
      ),
      [UnitTierNoteDocumentKey.lastUpdateEpoch]: this.lastUpdateEpoch,
    };
  }
}
