import {SupportedLanguages} from '../../../api-def/api';
import {TierNoteTraversalError} from './error';
import {UnitTierNote} from './model';


describe('Unit tier note model', () => {
  it('transforms to unit tier note using the given `lang`', async () => {
    const model = new UnitTierNote({
      unitId: 10950101,
      points: ['idA'],
      tier: {
        conAi: {
          isCompDependent: false,
          note: {
            [SupportedLanguages.CHT]: 'Note CHT',
          },
          ranking: 'S',
        },
      },
      lastUpdateEpoch: 0,
    });

    const tierNote = model.toUnitTierNote(SupportedLanguages.CHT);
    expect(tierNote.tier.conAi?.note).toBe('Note CHT');
  });

  it('returns the tier note in alternative language if the desired does not exist', async () => {
    const model = new UnitTierNote({
      unitId: 10950101,
      points: ['idA'],
      tier: {
        conAi: {
          isCompDependent: false,
          note: {
            [SupportedLanguages.CHT]: 'Note CHT',
          },
          ranking: 'S',
        },
      },
      lastUpdateEpoch: 0,
    });

    const tierNote = model.toUnitTierNote(SupportedLanguages.EN);
    expect(tierNote.tier.conAi?.note).toBe('Note CHT');
  });

  it('throws error if no available note', async () => {
    const model = new UnitTierNote({
      unitId: 10950101,
      points: ['idA'],
      tier: {
        conAi: {
          isCompDependent: false,
          note: {},
          ranking: 'S',
        },
      },
      lastUpdateEpoch: 0,
    });

    const fn = async () => {
      model.toUnitTierNote(SupportedLanguages.EN);
    };

    await expect(fn).rejects.toThrow(TierNoteTraversalError);
  });
});
