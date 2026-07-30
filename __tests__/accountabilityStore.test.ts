import { useAccountabilityStore } from '@/src/store/accountabilityStore';

describe('accountability store', () => {
  beforeEach(() => {
    useAccountabilityStore.setState({
      activeShield: {
        activatedAt: '2026-07-13T12:00:00.000Z',
        checkpointId: 'checkpoint-1',
        dueTimeLabel: '12:00 PM',
        requiredAmountMl: 250,
      },
      dailySkipCount: 0,
      overrideCount: 0,
      selectedApplicationCount: 1,
      skipDateKey: '2026-07-13',
      snoozedUntil: null,
    });
  });

  it('limits normal skips and clears the active shield when allowed', () => {
    expect(useAccountabilityStore.getState().skipForNow()).toBe(true);
    expect(useAccountabilityStore.getState().activeShield).toBeNull();
    expect(useAccountabilityStore.getState().dailySkipCount).toBe(1);

    useAccountabilityStore.setState({
      activeShield: {
        activatedAt: '2026-07-13T12:15:00.000Z',
        checkpointId: 'checkpoint-2',
        dueTimeLabel: '12:15 PM',
        requiredAmountMl: 500,
      },
    });

    expect(useAccountabilityStore.getState().skipForNow()).toBe(true);
    expect(useAccountabilityStore.getState().dailySkipCount).toBe(2);

    useAccountabilityStore.setState({
      activeShield: {
        activatedAt: '2026-07-13T12:30:00.000Z',
        checkpointId: 'checkpoint-3',
        dueTimeLabel: '12:30 PM',
        requiredAmountMl: 750,
      },
    });

    expect(useAccountabilityStore.getState().skipForNow()).toBe(false);
    expect(useAccountabilityStore.getState().activeShield?.checkpointId).toBe('checkpoint-3');
  });
});
