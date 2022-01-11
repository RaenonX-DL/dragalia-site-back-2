export type ResourceCache<T> = {
  lastFetchedEpoch: number,
  data: T,
};
