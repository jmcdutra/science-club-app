import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'science-club.session-token';

export async function getSessionToken() {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function setSessionToken(token: string) {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearSessionToken() {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}
