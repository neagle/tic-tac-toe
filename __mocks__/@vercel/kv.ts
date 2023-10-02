interface MockKV {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  data: Record<string, any>;
}

export const kv: MockKV = {
  data: {},
  get: jest.fn(async (key) => kv.data[key]),
  set: jest.fn(async (key, value) => {
    kv.data[key] = value;
  }),
  del: jest.fn(async (key) => {
    delete kv.data[key];
  }),
};
