let GoogleSignin = null;

try {
  const GoogleSigninModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = GoogleSigninModule.GoogleSignin;
  if (GoogleSignin && typeof GoogleSignin.configure === 'function') {
    GoogleSignin.configure({
      webClientId: "298605633-u5khvgj5c2mkp16l7u5hkktuqobnm4uq.apps.googleusercontent.com",
      androidClientId: "298605633-b5a79mmqb26jgsnvmigko1ouvkr4re9u.apps.googleusercontent.com",
      offlineAccess: false
    });
  }
} catch (e) {
  console.warn("GoogleSignin native module not available (e.g. running in Expo Go).");
}

export async function getGoogleIdToken() {
  if (!GoogleSignin || typeof GoogleSignin.hasPlayServices !== 'function') {
    throw new Error("Google Sign-In requires a custom development build or APK (not supported directly in standard Expo Go). Please use email/password login in Expo Go.");
  }
  await GoogleSignin.hasPlayServices();
  await GoogleSignin.signOut();
  await GoogleSignin.signIn();
  const { idToken } = await GoogleSignin.getTokens();
  return idToken;
}