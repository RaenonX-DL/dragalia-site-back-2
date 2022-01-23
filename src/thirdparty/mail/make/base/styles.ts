import {CSSProperties} from 'react';


type StyleNames = 'body' | 'titleMain' | 'titleImage' | 'titleText';

export const styles: {[name in StyleNames]: CSSProperties} = {
  body: {
    fontFamily: 'Calibri, "Microsoft JhengHei", sans-serif',
    padding: '1rem 5rem',
    fontSize: '16px',
  },
  titleMain: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '8rem',
    marginBottom: '1rem',
  },
  titleImage: {
    width: '100%',
    height: '8rem',
    backgroundImage: 'url(https://dl.raenonx.cc/img/nav.png)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    borderRadius: '0.5rem',
  },
  titleText: {
    fontSize: '2rem',
    marginBlock: 0,
    zIndex: 1,
    alignSelf: 'end',
  },
};
