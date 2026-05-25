const noopCache = {
  get: async (_key: string): Promise<string | null> => null,
  set: async (_key: string, _value: string, _ttl?: number): Promise<void> => {},
  del: async (_key: string): Promise<void> => {},
  quit: async (): Promise<void> => {},
  connect: async (): Promise<void> => {},
};

export const getRedis = () => noopCache;
export const cache = noopCache;
export const getCachedScore = async (_geid: string): Promise<any> => null;
export const setCachedScore = async (_geid: string, _score: any): Promise<void> => {};
export const cacheScore = async (_geid: string, _score: any): Promise<void> => {};
export const getCachedLtv = async (_geid: string): Promise<any> => null;
export const setCachedLtv = async (_geid: string, _ltv: any): Promise<void> => {};
export const cacheProtocolQuery = async (_key: string, _val: any): Promise<void> => {};
export const getCachedProtocolQuery = async (_key: string): Promise<any> => null;
export const getCachedQueryResponse = async (_key: string, _key2?: string): Promise<any> => null;
export const cacheQueryResponse = async (_key: string, _key2: string, _val: any): Promise<void> => {};
export const checkRateLimit = async (_key: string): Promise<boolean> => false;
export const checkAndIncrementRateLimit = async (_key: string, _block?: any): Promise<{ allowed: boolean; count: number }> => ({ allowed: true, count: 0 });
export const incrementRateLimit = async (_key: string): Promise<number> => 1;
export const invalidateScore = async (_geid: string): Promise<void> => {};

export default noopCache;