import { HumanizePipe } from './humanize.pipe';

fdescribe('Humanize duration pipe tests', () => {
  const cases: [number, string][] = [
    [1, '< 1 second'],
    [499, '< 1 second'],
    [500, '1 second'],
    [1499, '1 second'],
    [1500, '2 seconds'],
    [9999, '10 seconds'],
    [59999, '1 minute'],
    [89999, '2 minutes'],
    [90000, '2 minutes'],
    [600000, '10 minutes'],
    [3599999, '1 hour'],
    [3600000, '1 hour'],
    [7200000, '2 hours'],
    [21600000, '6 hours'],
    [43200000, '1 day'],
  ];

  for (const [input, expected] of cases) {
    it(`Expect ${input} milliseconds to be displayed as ${expected}`, () => {
      // Arrange
      const pipe = new HumanizePipe();

      // Act
      const actual = pipe.transform(input);

      // Assert
      expect(actual).toBe(expected);
    });
  }
});
