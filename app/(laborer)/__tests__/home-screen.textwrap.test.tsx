import React from 'react';
import renderer, { act } from 'react-test-renderer';
import HomeScreen from '../(tabs)/home';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useFocusEffect: (cb: any) => cb(() => {}),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

global.fetch = jest.fn();

describe('HomeScreen text rendering', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders full status and customer text without truncation logic', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'userToken') return 'token';
      if (key === 'userData') return JSON.stringify({ name: 'Najeeb', isAvailable: false });
      return null;
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Najeeb', isAvailable: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todayEarnings: 0, completedJobsToday: 0, shiftHours: 0, currentRating: 4.5, totalReviews: 13 }),
      });

    let tree: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<HomeScreen />);
      await Promise.resolve();
    });

    const texts = (tree! as any).root.findAllByType('Text').map((n: any) => n.props.children).flat();
    // Ensure status string includes "Offline"
    expect(texts.join(' ')).toContain('You are currently Offline');
  });
});
