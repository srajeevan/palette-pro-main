import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Lazy imports — these native modules may not be available until a dev client rebuild
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
        }),
    });
} catch (e) {
    console.log('expo-notifications or expo-device not available — skipping notification setup');
}

// ── Configuration ──

const NOTIFICATION_PERMISSION_KEY = 'notification_permission_asked';
const NOTIFICATIONS_SCHEDULED_KEY = 'notifications_scheduled_date';

// ── Notification Content ──

const STREAK_REMINDERS = [
    {
        title: "Your streak is waiting",
        body: "Open Palette Pro to keep your painting streak alive.",
    },
    {
        title: "Don't break the chain",
        body: "A quick palette keeps your streak going. Takes 30 seconds.",
    },
    {
        title: "Your colors miss you",
        body: "Keep your painting momentum — check in today.",
    },
];

const INSPIRATION_MESSAGES = [
    {
        title: "Try something new today",
        body: "Upload a new reference and discover unexpected color combinations.",
    },
    {
        title: "Color tip of the day",
        body: "Warm highlights + cool shadows = instant depth. Try it with the temperature map.",
    },
    {
        title: "Master painter moment",
        body: "The squint tool reveals what the masters see. Have you tried it on your latest reference?",
    },
    {
        title: "Quick study idea",
        body: "Pick any photo from your gallery and extract its palette. You'll be surprised what you find.",
    },
];

const UNSAVED_PALETTE_REMINDERS = [
    {
        title: "Unsaved palette alert",
        body: "You created something beautiful — save it before it's gone.",
    },
    {
        title: "Your palette is waiting",
        body: "Don't lose those colors. Open the app to save your work.",
    },
];

// ── Permission Helpers ──

export async function hasAskedPermission(): Promise<boolean> {
    const asked = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);
    return asked === 'true';
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (!Notifications || !Device) return false;
    if (!Device.isDevice) {
        console.log('Notifications require a physical device');
        return false;
    }

    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');

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
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    return true;
}

export async function isPermissionGranted(): Promise<boolean> {
    if (!Notifications) return false;
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
}

// ── Scheduling ──

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function scheduleRetentionNotifications(): Promise<void> {
    if (!Notifications) return;

    const granted = await isPermissionGranted();
    if (!granted) return;

    const today = new Date().toISOString().split('T')[0];
    const lastScheduled = await AsyncStorage.getItem(NOTIFICATIONS_SCHEDULED_KEY);
    if (lastScheduled === today) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    // Streak reminder — daily at 10 AM
    const streakMsg = pickRandom(STREAK_REMINDERS);
    await Notifications.scheduleNotificationAsync({
        content: {
            title: streakMsg.title,
            body: streakMsg.body,
            data: { type: 'streak_reminder' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 10,
            minute: 0,
        },
    });

    // Inspiration — daily at 2 PM
    const inspirationMsg = pickRandom(INSPIRATION_MESSAGES);
    await Notifications.scheduleNotificationAsync({
        content: {
            title: inspirationMsg.title,
            body: inspirationMsg.body,
            data: { type: 'inspiration' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 14,
            minute: 0,
        },
    });

    await AsyncStorage.setItem(NOTIFICATIONS_SCHEDULED_KEY, today);
}

export async function scheduleUnsavedPaletteReminder(): Promise<void> {
    if (!Notifications) return;

    const granted = await isPermissionGranted();
    if (!granted) return;

    const msg = pickRandom(UNSAVED_PALETTE_REMINDERS);
    await Notifications.scheduleNotificationAsync({
        content: {
            title: msg.title,
            body: msg.body,
            data: { type: 'unsaved_palette' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 4 * 60 * 60,
        },
    });
}

export async function cancelUnsavedPaletteReminders(): Promise<void> {
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
        if (notif.content.data?.type === 'unsaved_palette') {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
    }
}
