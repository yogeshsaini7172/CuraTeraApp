import { getMessaging, getToken, requestPermission, onMessage, AuthorizationStatus } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

/**
 * Request notification permission (required for Android 13+).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS or older Android — request via Firebase
  try {
    const messaging = getMessaging();
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    return enabled;
  } catch (error) {
    console.log('Firebase requestPermission failed:', error);
    return false;
  }
}

/**
 * Get the FCM device token. This is the unique address
 * the Python backend uses to push notifications to THIS device.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    console.log('===== FCM TOKEN =====');
    console.log(token);
    console.log('=====================');
    return token;
  } catch (error) {
    console.log('Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Listen for foreground messages and show an alert.
 */
export function onForegroundMessage() {
  try {
    const messaging = getMessaging();
    return onMessage(messaging, async remoteMessage => {
      console.log('FCM foreground message received:', JSON.stringify(remoteMessage));
      const title = remoteMessage.notification?.title || 'CuraTera AI';
      const body = remoteMessage.notification?.body || '';
      Alert.alert(title, body);
    });
  } catch (error) {
    console.log('Firebase onMessage failed:', error);
    return () => {};
  }
}
