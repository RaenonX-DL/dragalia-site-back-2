import prettier from 'prettier';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import {EmailContent, EmailContentProps} from './component';


type GenerateMailHtmlOptions = EmailContentProps & {
  prettify?: boolean,
};

export const generateMailHTML = ({prettify, ...props}: GenerateMailHtmlOptions): string => {
  const html = ReactDOMServer.renderToStaticMarkup(<EmailContent {...props}/>);
  const htmlWDoc = '<!DOCTYPE html>' + html;

  if (!prettify) {
    return htmlWDoc;
  }

  return prettier.format(htmlWDoc, {parser: 'html'});
};
