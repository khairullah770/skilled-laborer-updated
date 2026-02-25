import React from 'react';
import renderer, { act } from 'react-test-renderer';
import HomeScreen from '../(tabs)/home';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (cb: any) => cb(() => {}),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

global.fetch = jest.fn();

const setupFetch = (profile: any, stats: any = { todayEarnings: 0, completedJobsToday: 0, shiftHours: 0, currentRating: 4, totalReviews: 10 }) => {
  (global.fetch as jest.Mock)
    .mockResolvedValueOnce({ ok: true, json: async () => profile }) // profile
    .mockResolvedValueOnce({ ok: true, json: async () => stats });  // stats
};

describe('HomeScreen display name', () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockReset();
    (AsyncStorage.setItem as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockReset();
  });

  it('uses first name when full name present', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('token').mockResolvedValueOnce(JSON.stringify({ name: 'John Doe' }));
    setupFetch({ name: 'John Doe', email: 'john@example.com', isAvailable: true });
    let tree: renderer.ReactTestRenderer;
    await act(async () => { tree = renderer.create(<HomeScreen />); await Promise.resolve(); });
    const textNodes = (tree! as any).root.findAllByType('Text');
    const header = textNodes.map((n: any) => n.props.children).flat().join(' ');
    expect(header).toContain('John');
  });

  it('falls back to email local part when name missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('token').mockResolvedValueOnce(JSON.stringify({ name: '' }));
    setupFetch({ name: '', email: 'worker@example.com', isAvailable: true });
    let tree: renderer.ReactTestRenderer;
    await act(async () => { tree = renderer.create(<HomeScreen />); await Promise.resolve(); });
    const textNodes = (tree! as any).root.findAllByType('Text');
    const header = textNodes.map((n: any) => n.props.children).flat().join(' ');
    expect(header).toContain('worker');
  });

  it('falls back to masked phone when name and email missing', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('token').mockResolvedValueOnce(JSON.stringify({}));
    setupFetch({ name: '', email: '', phone: '03001234567', isAvailable: true });
    let tree: renderer.ReactTestRenderer;
    await act(async () => { tree = renderer.create(<HomeScreen />); await Promise.resolve(); });
    const textNodes = (tree! as any).root.findAllByType('Text');
    const header = textNodes.map((n: any) => n.props.children).flat().join(' ');
    expect(header).toMatch(/User-4567/);
  });

  it('defaults to "Laborer" when no identifiers available', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('token').mockResolvedValueOnce(JSON.stringify({}));
    setupFetch({ name: '', email: '', phone: '', isAvailable: true });
    let tree: renderer.ReactTestRenderer;
    await act(async () => { tree = renderer.create(<HomeScreen />); await Promise.resolve(); });
    const textNodes = (tree! as any).root.findAllByType('Text');
    const header = textNodes.map((n: any) => n.props.children).flat().join(' ');
    expect(header).toContain('Laborer');
  });
});
