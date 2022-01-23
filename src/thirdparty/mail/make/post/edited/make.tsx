import React from 'react';

import {MailContent} from '../../../type';
import {generateMailContent} from '../../base/make';
import {MailContentEditedComponent} from './html';
import {makeMailContentEditedText} from './text';
import {makeMailContentEditedTitle} from './title';
import {MakeMailContentEditedOpts} from './type';


export const makeMailContentEdited = (opts: MakeMailContentEditedOpts): MailContent => {
  return generateMailContent({
    ...opts,
    getSubject: makeMailContentEditedTitle,
    getText: makeMailContentEditedText,
    getHtml: (opts) => <MailContentEditedComponent {...opts}/>,
  });
};
