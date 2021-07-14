export const processUnitIdentifier = (unitIdentifier: number | string): number | string => {
  let ret = Number(unitIdentifier) || unitIdentifier;

  if (typeof ret === 'string') {
    ret = ret.replace('_', ' ');
  }

  return ret;
};
