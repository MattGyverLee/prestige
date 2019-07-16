const mock = {
  addListener: jest.fn(),

  handleEvent: jest.fn(evt => {
    console.log("Handle Events");
    switch (evt.type) {
      case "region-out":
        console.log("region-out");
        break;
      case "region-in":
        console.log("region-in");
        break;
      default:
        console.log("none");
        break;
    }
  }),

  on: jest.fn()
};

export default {
  ...mock,
  constructor: jest.fn(() => {
    return mock;
  }),
  create: jest.fn(() => {
    return mock;
  })
};
