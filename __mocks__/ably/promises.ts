const Rest = jest.fn().mockImplementation(() => {
  return {
    channels: {
      get: jest.fn().mockImplementation(() => {
        return {
          publish: jest.fn().mockImplementation(() => Promise.resolve()),
        };
      }),
    },
  };
});

// Mimic the original package's named exports
export { Rest };
