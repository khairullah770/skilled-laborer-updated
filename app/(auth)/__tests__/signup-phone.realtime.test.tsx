import React from 'react';
import renderer, { act } from 'react-test-renderer';
import SignupScreen from '../../(auth)/signup';

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

jest.mock('../../../components/Button', () => {
  return ({ onPress, text, disabled }: any) => {
    return { type: 'Button', props: { onPress, text, disabled } } as any;
  };
});

jest.mock('../../../components/Input', () => {
  return (props: any) => {
    return { type: 'Input', props } as any;
  };
});

describe('Customer Signup Phone Realtime Validation', () => {
  it('shows phone format error while typing and clears on valid format', () => {
    const tree = renderer.create(<SignupScreen />);
    const root: any = tree.root;

    const inputs = root.findAll((n: any) => n.type === 'Input');
    const firstName = inputs[0];
    const lastName = inputs[1];
    const email = inputs[2];
    const phone = inputs[3];

    act(() => {
      firstName.props.onChangeText('John');
      lastName.props.onChangeText('Doe');
      email.props.onChangeText('john@example.com');
      phone.props.onChangeText('3');
    });

    let textNodes = root.findAll((n: any) => n.type === 'Text' && typeof n.props.children === 'string');
    const phoneError1 = textNodes.find((n: any) => /Phone must match \+92 3XX XXXXXXX/i.test(n.props.children));
    expect(phoneError1).toBeTruthy();

    act(() => {
      phone.props.onChangeText('3211234567');
    });
    textNodes = root.findAll((n: any) => n.type === 'Text' && typeof n.props.children === 'string');
    const phoneError2 = textNodes.find((n: any) => /Phone must match \+92 3XX XXXXXXX/i.test(n.props.children));
    expect(phoneError2).toBeFalsy();
  });
});
