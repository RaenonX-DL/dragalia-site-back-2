export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

export const getCurrentEpoch = (): number => new Date().valueOf();
