export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') return false;

    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  } catch (error) {
    console.log('Permission error:', error);
    return false;
  }
};

export const sendPushNotification = (
  title: string,
  options?: NotificationOptions
) => {
  try {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) return;

    if (Notification.permission !== 'granted') return;

    setTimeout(() => {
      try {
        new Notification(title, {
          ...options,
          icon: options?.icon || '/favicon.ico',
        });
      } catch (err) {
        console.log('Notification failed:', err);
      }
    }, 0);

  } catch (error) {
    console.log('Notification error:', error);
  }
};