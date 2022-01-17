import {SupportedLanguages} from '../../../../api-def/api';
import {MakeMailContentPublishedOpts} from '../published/type';


export const makeMailContentEditedTitle = ({lang, title}: MakeMailContentPublishedOpts): string => {
  if (lang === SupportedLanguages.EN) {
    return `Post Updated - ${title}`;
  }

  return `【文章更新】${title}`;
};
