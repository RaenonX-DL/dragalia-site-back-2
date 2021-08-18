import {SupportedLanguages} from '../../../api-def/api';
import {DescriptionTraversalError} from './error';
import {KeyPointEntry} from './model';


describe('Key point entry model', () => {
  it('gets the description in the given language if it exists', async () => {
    const model = new KeyPointEntry({
      type: 'strength',
      description: {
        [SupportedLanguages.CHT]: 'A',
        [SupportedLanguages.EN]: 'B',
        [SupportedLanguages.JP]: 'C',
      },
    });

    expect(model.getDescription(SupportedLanguages.CHT)).toBe('A');
  });

  it('gets the description in alternative language if it does not exist', async () => {
    const model = new KeyPointEntry({
      type: 'strength',
      description: {
        [SupportedLanguages.CHT]: 'C',
      },
    });

    expect(model.getDescription(SupportedLanguages.EN)).toBe('C');
  });

  it('throws error if no available description', async () => {
    const model = new KeyPointEntry({
      type: 'strength',
      description: {},
    });

    const fn = async () => {
      model.getDescription(SupportedLanguages.CHT);
    };

    await expect(fn).rejects.toThrow(DescriptionTraversalError);
  });
});
