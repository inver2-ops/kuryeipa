import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CourierProvider, useCourier } from "../contexts/CourierContext";

function RootLayoutContent() {
  const { workerUrl, isLoaded, courier } = useCourier();
  const registered = useRef(false);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  useEffect(() => {
    try {
      const N = require("expo-notifications");
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    } catch (_e) {}
  }, []);

  useEffect(() => {
    if (!isLoaded || !workerUrl || !courier?.id) return;
    if (registered.current) return;

    const register = async () => {
      try {
        const Notifications = require("expo-notifications");
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync(
            "inver_courier_orders",
            {
              name: "Yeni Sipariş Bildirimleri",
              importance: Notifications.AndroidImportance.MAX,
              sound: "water_drop.wav",
              vibrationPattern: [0, 400, 200, 400, 200, 600],
              lightColor: "#0A7EC8",
              lockscreenVisibility:
                Notifications.AndroidNotificationVisibility.PUBLIC,
              bypassDnd: true,
              enableVibrate: true,
            },
          );
        }
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== "granted") return;
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "26f8a551-36a9-4a20-9718-9b3dcf56685e",
        });
        await fetch(`${workerUrl.replace(/\/$/, "")}/courier-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courierId: courier.id,
            token: tokenData.data,
          }),
        });
        registered.current = true;
        retryCount.current = 0;
        if (retryRef.current) clearTimeout(retryRef.current);
      } catch (_e: any) {
        if (retryCount.current < 10) {
          retryCount.current += 1;
          retryRef.current = setTimeout(
            register,
            Math.min(retryCount.current * 15000, 120000),
          );
        }
      }
    };

    retryRef.current = setTimeout(register, 3000);
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [workerUrl, isLoaded, courier?.id]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CourierProvider>
        <RootLayoutContent />
      </CourierProvider>
    </SafeAreaProvider>
  );
}
