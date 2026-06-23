import {
  calculateDailyGoalMl,
  calculateProgress,
  generateCheckpoints,
} from '@/src/features/hydration/hydrationMath';

describe('hydration math', () => {
  it('calculates a lifestyle-adjusted daily goal', () => {
    expect(
      calculateDailyGoalMl({
        weight: 180,
        unitPreference: 'imperial',
        activityLevel: 'moderate',
        climate: 'hot',
      }),
    ).toBe(3550);
  });

  it('splits the goal into active-hour checkpoints', () => {
    const checkpoints = generateCheckpoints(3000, '08:00', '20:00');

    expect(checkpoints).toHaveLength(4);
    expect(checkpoints[0]).toMatchObject({ timeLabel: '11:00', targetMl: 750 });
    expect(checkpoints[3]).toMatchObject({ timeLabel: '20:00', targetMl: 3000 });
  });

  it('returns capped progress and remaining amount', () => {
    expect(calculateProgress(3200, 3000)).toEqual({
      loggedMl: 3200,
      remainingMl: 0,
      percentComplete: 100,
    });
  });
});
