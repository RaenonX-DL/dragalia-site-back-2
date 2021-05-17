export const isAppOnHeroku = (): boolean => {
  return !!process.env.DYNO;
};
