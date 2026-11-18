import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is running (foreground & background)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn('Failed to set notification handler:', e);
}

/**
 * Request notification permissions and setup Android high-priority channel
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Studio Reminders & Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#be185d',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }
    return true;
  } catch (err) {
    console.warn('Error requesting notification permissions:', err);
    return false;
  }
}

/**
 * Schedule device system notification that triggers outside of the app
 */
export async function scheduleReminderNotification(reminder: {
  id: string;
  text: string;
  kind?: string;
  remindAt: string;
}): Promise<string | null> {
  try {
    const hasPerm = await requestNotificationPermissions();
    if (!hasPerm) return null;

    const targetDate = new Date(reminder.remindAt);
    const now = new Date();

    if (isNaN(targetDate.getTime())) return null;

    const title = `🔔 ${reminder.kind ? reminder.kind.toUpperCase() : 'STUDIO REMINDER'}`;
    const body = reminder.text;

    // If target date is in the future
    if (targetDate.getTime() > now.getTime()) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { reminderId: reminder.id },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
          channelId: Platform.OS === 'android' ? 'reminders' : undefined,
        },
      });
      return identifier;
    } else {
      // Immediate notification
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { reminderId: reminder.id },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
      return identifier;
    }
  } catch (err) {
    console.warn('Failed to schedule outside app reminder notification:', err);
    return null;
  }
}

/**
 * Cancel a scheduled reminder notification
 */
export async function cancelReminderNotification(identifier: string): Promise<void> {
  try {
    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    }
  } catch (err) {
    console.warn('Failed to cancel notification:', err);
  }
}
