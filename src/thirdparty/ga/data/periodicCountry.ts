import {google} from '@google-analytics/data/build/protos/protos';

import {
  GAPeriodicCountryUserData,
  GAPeriod,
  GAPeriodKey,
  GACountryUserEntry,
} from '../../../api-def/api';
import {gaClient, property} from '../client';


export const getPeriodicCountryUser = async (): Promise<GAPeriodicCountryUserData> => {
  const [response] = await gaClient.runReport({
    property,
    dateRanges: Object.entries(GAPeriod).map(([name, length]) => ({
      startDate: `${length}daysAgo`, endDate: 'today', name,
    })),
    dimensions: [{name: 'country'}],
    metrics: [{name: 'activeUsers'}],
    metricAggregations: [google.analytics.data.v1alpha.MetricAggregation.TOTAL],
  });

  const result: GAPeriodicCountryUserData = {
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

  // Fill entries by country
  response.rows?.forEach((row) => {
    Object.entries(GAPeriod).forEach(([name]) => {
      if (!row.dimensionValues?.some((value) => value.value === name) || !row.metricValues) {
        return;
      }

      const countryName = row.dimensionValues?.find((value) => value.value !== name);

      if (!countryName || !countryName.value) {
        return;
      }

      const entry: GACountryUserEntry = {
        country: countryName.value,
        user: Number(row.metricValues[0].value),
      };

      result[name as GAPeriodKey].countries.push(entry);
    });
  });

  // Fill data of dimensional total
  response.totals?.forEach((total) => {
    Object.entries(GAPeriod).forEach(([name]) => {
      if (!total.dimensionValues?.some((value) => value.value === name) || !total.metricValues) {
        return;
      }

      result[name as GAPeriodKey].total = Number(total.metricValues[0].value);
    });
  });

  return result;
};
