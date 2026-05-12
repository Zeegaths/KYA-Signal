const noopCache = {
  get: async (_key: string): Promise<string | null> => null,
  set: async (_key: string, _value: string, _ttl?: number): Promise<void> => {},
  del: async (_key: string): Promise<void> => {},
  quit: async (): Promise<void> => {},
};

export const getRedis = () => noopCache;
export const cache = noopCache;
export default noopCache;