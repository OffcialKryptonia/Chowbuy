import { Redirect } from 'expo-router';

/** The email confirmation page opens the app at chowbuyrider://auth-callback. There is nothing to show here: go to the start screen, where the rider signs in. */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
