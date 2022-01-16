import {SupportedLanguages} from '../../../../api-def/api';
import {MakeMailContentPublishedOpts} from './type';


export const makeMailContentPublishedTitle = ({
  lang, title,
}: MakeMailContentPublishedOpts): string => {
  if (lang === SupportedLanguages.EN) {
    return `New Post Published - ${title}`;
  }

  return `【新文章發布】${title}`;
};
