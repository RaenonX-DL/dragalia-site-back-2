import {MailContent} from '../../type';
import {generateMailHTML} from './generator';
import {GenerateMailContentOpts, GenerateMailOpts} from './type';


export const generateMailContent = <T extends GenerateMailOpts>(
  opts: GenerateMailContentOpts<T>,
): MailContent => {
  const {getSubject, getText, getHtml} = opts;

  const subject = getSubject(opts);
  const text = getText(opts);

  return {
    subject,
    text,
    html: generateMailHTML({
      ...opts,
      title: subject,
      content: getHtml({...opts, subject}),
    }),
  };
};
