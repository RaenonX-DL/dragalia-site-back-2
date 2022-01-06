import {GAPeriodicCountryUserData, GAPeriodicLangUserData} from '../../../src/api-def/api';


export const periodicLangData: GAPeriodicLangUserData = [
  {date: '20220103', user: {'English': 777, 'Chinese': 888}},
  {date: '20220104', user: {'English': 666, 'Chinese': 999}},
];

export const periodicCountryData: GAPeriodicCountryUserData = {
  D1: {
    countries: [],
    total: 0,
  },
  D7: {
    countries: [],
    total: 0,
  },
  D30: {
    countries: [],
    total: 0,
  },
};
