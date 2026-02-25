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
  return ({ onPress, text }: any) => {
    return { type: 'Button', props: { onPress, text } } as any;
  };
});

jest.mock('../../../components/Input', () => {
  return (props: any) => {
    return { type: 'Input', props } as any;
  };
});

describe('Customer Signup Email Validation', () => {
  it('shows error for invalid email format and prevents submission', () => {
    const tree = renderer.create(<SignupScreen />);
    const root: any = tree.root;

    const inputs = root.findAll((n: any) => n.type === 'Input');
    const firstName = inputs[0];
    const lastName = inputs[1];
    const email = inputs[2];
    const phone = inputs[3];
    const password = inputs[4];
    const confirmPassword = inputs[5];

    act(() => {
      firstName.props.onChangeText('John');
      lastName.props.onChangeText('Doe');
      email.props.onChangeText('john@invalid');
      phone.props.onChangeText('+923001234567');
      password.props.onChangeText('Password1!');
      confirmPassword.props.onChangeText('Password1!');
    });

    const button = root.find((n: any) => n.type === 'Button');
    act(() => {
      button.props.onPress();
    });

    const errorTexts = root.findAll((n: any) => n.type === 'Text' && typeof n.props.children === 'string');
    const emailError = errorTexts.find((n: any) => /valid email/i.test(n.props.children));
    expect(emailError).toBeTruthy();
  });
});
