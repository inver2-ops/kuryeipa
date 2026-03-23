import { Tabs } from "expo-router";
import { Platform, View, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCourier } from "../../contexts/CourierContext";
import { useTranslation } from "../../constants/translations";

export default function TabLayout() {
  const { language, pendingOrders, activeOrder } = useCourier();
  const tr = useTranslation(language);
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  const BLUE = "#0A7EC8";
  const RED = "#EF4444";
  const tabBg = dark ? "#060F1C" : "#FFFFFF";
  const inactive = dark ? "rgba(255,255,255,0.35)" : "#8FA8BF";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(10,126,200,0.12)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BLUE,
        tabBarInactiveTintColor: inactive,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "transparent" : tabBg,
          borderTopWidth: 1,
          borderTopColor: border,
          elevation: 0,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: tr("pending"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: "relative" }}>
              <Ionicons
                name={focused ? "list" : "list-outline"}
                size={22}
                color={color}
              />
              {pendingOrders.length > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -10,
                    backgroundColor: RED,
                    borderRadius: 9,
                    minWidth: 18,
                    height: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{ fontSize: 10, fontWeight: "900", color: "#fff" }}
                  >
                    {pendingOrders.length}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: tr("active"),
          tabBarIcon: ({ color, focused }) => (
            <View style={{ position: "relative" }}>
              <Ionicons
                name={focused ? "bicycle" : "bicycle-outline"}
                size={22}
                color={color}
              />
              {activeOrder && (
                <View
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -8,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#22C55E",
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: tr("history"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: tr("stats"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title:
            language === "tr"
              ? "Ayarlar"
              : language === "uk"
                ? "Налаш."
                : language === "ru"
                  ? "Настр."
                  : "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
