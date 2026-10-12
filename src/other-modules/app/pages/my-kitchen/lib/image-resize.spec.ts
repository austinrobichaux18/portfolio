import { fitWithin } from './image-resize';

describe('fitWithin', () => {
  it('scales the longer edge down to the limit, keeping the aspect ratio', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 400)).toEqual({ width: 300, height: 400 });
  });

  it('never scales up', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});
