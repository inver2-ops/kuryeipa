import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { useCourier } from "../../contexts/CourierContext";

export default function ActiveScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeOrder,
    startDelivery,
    completeOrder,
    cancelOrder,
    language,
    workerUrl,
    courier,
  } = useCourier();
  const isPerOrder =
    courier?.paymentType === "per_order" || !courier?.paymentType;
  const perOrderAmt = courier?.perOrderAmount || 0;
  const dark = useColorScheme() === "dark";

  const BLUE = "#0A7EC8";
  const GREEN = "#16A34A";
  const RED = "#DC2626";
  const AMBER = "#D97706";
  const PURP = "#7C3AED";
  const TXT = dark ? "#F0F8FF" : "#0A1929";
  const TXT2 = dark ? "rgba(240,248,255,0.6)" : "#3A6A8A";
  const TXT3 = dark ? "rgba(240,248,255,0.3)" : "#8CB8D0";
  const BG = dark ? "#030B15" : "#EFF8FF";
  const CARD = dark ? "#0C1E33" : "#FFFFFF";
  const BDR = dark ? "rgba(255,255,255,0.08)" : "#D4E8F7";

  const [delivering, setDelivering] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [locStatus, setLocStatus] = useState<"idle" | "tracking" | "error">(
    "idle",
  );
  const locTimer = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activeOrder?.status === "on_the_way") {
      startTracking();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      stopTracking();
      pulseAnim.stopAnimation();
    }
    return () => stopTracking();
  }, [activeOrder?.status]);

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocStatus("error");
      return;
    }
    setLocStatus("tracking");
    sendLoc();
    locTimer.current = setInterval(sendLoc, 25000);
  };
  const stopTracking = () => {
    clearInterval(locTimer.current);
    setLocStatus("idle");
  };

  const sendLoc = async () => {
    try {
      const l = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await fetch(`${workerUrl}/courier-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courierId: courier?.id,
          orderId: activeOrder?.orderId,
          lat: l.coords.latitude,
          lng: l.coords.longitude,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {}
  };

  const openNav = () => {
    if (!activeOrder) return;
    const q = encodeURIComponent(
      [activeOrder.city, activeOrder.street, activeOrder.building]
        .filter(Boolean)
        .join(", "),
    );
    const url =
      Platform.OS === "ios" ? `maps://?daddr=${q}` : `google.navigation:q=${q}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/maps?daddr=${q}`),
    );
  };
  const callCustomer = () => {
    if (activeOrder?.phone)
      Linking.openURL(`tel:${activeOrder.phone.replace(/\s/g, "")}`);
  };

  const handleStart = async () => {
    if (!activeOrder) return;
    setDelivering(true);
    await startDelivery(activeOrder.orderId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDelivering(false);
  };

  const handleComplete = () =>
    Alert.alert(
      lbl(
        "✅ Teslim Edildi Mi?",
        "✅ Доставлено?",
        "✅ Delivered?",
        "✅ Доставлено?",
      ),
      lbl(
        "Siparişi teslim ettiğini onaylıyor musun?",
        "Підтвердити доставку?",
        "Confirm delivery?",
        "Подтвердить доставку?",
      ),
      [
        {
          text: lbl("İptal", "Скасувати", "Cancel", "Отмена"),
          style: "cancel",
        },
        {
          text: lbl(
            "✅ Teslim Edildi",
            "✅ Доставлено",
            "✅ Delivered",
            "✅ Доставлено",
          ),
          onPress: async () => {
            setCompleting(true);
            await completeOrder(activeOrder!.orderId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCompleting(false);
          },
        },
      ],
    );

  const handleCancel = () =>
    Alert.alert(
      lbl(
        "Siparişi İptal Et",
        "Скасувати замовлення",
        "Cancel Order",
        "Отменить заказ",
      ),
      lbl("Emin misin?", "Впевнений?", "Are you sure?", "Уверен?"),
      [
        { text: lbl("Geri", "Назад", "Back", "Назад"), style: "cancel" },
        {
          text: lbl("İptal Et", "Скасувати", "Cancel", "Отменить"),
          style: "destructive",
          onPress: async () => {
            await cancelOrder(activeOrder!.orderId);
            Haptics.selectionAsync();
          },
        },
      ],
    );

  const lbl = (tr_: string, uk_: string, en_: string, ru_: string) =>
    language === "tr"
      ? tr_
      : language === "uk"
        ? uk_
        : language === "ru"
          ? ru_
          : en_;

  if (!activeOrder)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <View style={{ paddingTop: insets.top }} />
        <View
          style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: BLUE + "10",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            borderWidth: 2,
            borderColor: BLUE + "20",
            borderStyle: "dashed",
          }}
        >
          <Text style={{ fontSize: 52 }}>🛵</Text>
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "900",
            color: TXT,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {lbl(
            "Aktif sipariş yok",
            "Немає активного замовлення",
            "No active order",
            "Нет активного заказа",
          )}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: TXT2,
            textAlign: "center",
            lineHeight: 21,
          }}
        >
          {lbl(
            "Siparişler sekmesinden bir teslimat kabul et",
            "Прийми замовлення у вкладці замовлень",
            "Accept a delivery from the orders tab",
            "Прими заказ во вкладке заказов",
          )}
        </Text>
      </View>
    );

  const addr = [
    activeOrder.city,
    activeOrder.street,
    activeOrder.building,
    activeOrder.flat ? `D:${activeOrder.flat}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  const isOnTheWay = activeOrder.status === "on_the_way";
  const num =
    activeOrder.dailyOrderNumber ?? (activeOrder.orderId || "").slice(-4);
  const headerBg = isOnTheWay ? GREEN : BLUE;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* ── STATUS HEADER ── */}
      <View style={{ paddingTop: insets.top, backgroundColor: headerBg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 18,
            paddingVertical: 16,
            gap: 12,
          }}
        >
          <Animated.View
            style={{ transform: [{ scale: isOnTheWay ? pulseAnim : 1 }] }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 26 }}>{isOnTheWay ? "🚴" : "📦"}</Text>
            </View>
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>
              {isOnTheWay
                ? lbl("Yoldasın!", "В дорозі!", "On the way!", "В дороге!")
                : lbl(
                    "Sipariş Alındı",
                    "Замовлення прийнято",
                    "Order Accepted",
                    "Заказ принят",
                  )}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
                marginTop: 2,
              }}
            >
              #{num} · {(activeOrder.total || 0).toFixed(0)}₴ Kasa
            </Text>
          </View>
          {locStatus === "tracking" && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: "#4ADE80",
                }}
              />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>
                GPS
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 14,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── ANA KART ── */}
        <View
          style={{
            backgroundColor: CARD,
            borderRadius: 24,
            borderWidth: 1.5,
            borderColor: isOnTheWay ? GREEN + "40" : BLUE + "30",
            marginBottom: 12,
            overflow: "hidden",
            shadowColor: isOnTheWay ? GREEN : BLUE,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          {/* Müşteri */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 18,
              borderBottomWidth: 1,
              borderBottomColor: BDR,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: BLUE + "15",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: BLUE + "25",
              }}
            >
              <Ionicons name="person" size={24} color={BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: TXT }}>
                {activeOrder.name}
              </Text>
              <Pressable onPress={callCustomer}>
                <Text
                  style={{
                    fontSize: 14,
                    color: BLUE,
                    fontWeight: "700",
                    marginTop: 3,
                  }}
                >
                  📞 {activeOrder.phone}
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={callCustomer}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: GREEN + "15",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: GREEN + "30",
              }}
            >
              <Ionicons name="call" size={24} color={GREEN} />
            </Pressable>
          </View>

          {/* Adres */}
          <Pressable
            onPress={() =>
              Linking.openURL(
                activeOrder.lat && activeOrder.lng
                  ? `https://www.google.com/maps?q=${activeOrder.lat},${activeOrder.lng}&zoom=18`
                  : `https://maps.google.com/?q=${encodeURIComponent(addr)}`,
              )
            }
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                padding: 16,
                backgroundColor: RED + "06",
                borderBottomWidth: 1,
                borderBottomColor: BDR,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: RED + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                }}
              >
                <Ionicons name="location" size={18} color={RED} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: TXT,
                    lineHeight: 22,
                    fontWeight: "500",
                  }}
                >
                  {addr}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: BLUE,
                    marginTop: 5,
                    fontWeight: "600",
                  }}
                >
                  🗺{" "}
                  {lbl(
                    "Haritada aç",
                    "Відкрити на карті",
                    "Open in maps",
                    "Открыть на карте",
                  )}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={TXT3} />
            </View>
          </Pressable>

          {/* Sipariş detay */}
          <View style={{ flexDirection: "row", padding: 14, gap: 8 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: BLUE + "0C",
                borderRadius: 16,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: BLUE + "18",
              }}
            >
              <Text style={{ fontSize: 11, color: BLUE, fontWeight: "700" }}>
                💧 {lbl("Su", "Вода", "Water", "Вода")}
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "900",
                  color: BLUE,
                  marginTop: 4,
                }}
              >
                {activeOrder.liters}L
              </Text>
            </View>
            {(activeOrder.deposits || 0) > 0 && (
              <View
                style={{
                  flex: 1,
                  backgroundColor: AMBER + "0C",
                  borderRadius: 16,
                  padding: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: AMBER + "18",
                }}
              >
                <Text style={{ fontSize: 11, color: AMBER, fontWeight: "700" }}>
                  🫙 {lbl("Şişe", "Каністра", "Bottle", "Канистра")}
                </Text>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "900",
                    color: AMBER,
                    marginTop: 4,
                  }}
                >
                  ×{activeOrder.deposits}
                </Text>
              </View>
            )}
            <View
              style={{
                flex: 1,
                backgroundColor: GREEN + "0C",
                borderRadius: 16,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: GREEN + "18",
              }}
            >
              <Text style={{ fontSize: 11, color: GREEN, fontWeight: "700" }}>
                🏦 Kasa
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: GREEN,
                  marginTop: 4,
                }}
              >
                {(activeOrder.total || 0).toFixed(0)}₴
              </Text>
            </View>
          </View>

          {/* İndirim */}
          {activeOrder.discountCode && (
            <View
              style={{
                marginHorizontal: 14,
                marginBottom: 14,
                backgroundColor: GREEN + "10",
                borderRadius: 14,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: GREEN + "25",
              }}
            >
              <Ionicons name="ticket" size={16} color={GREEN} />
              <Text
                style={{
                  fontSize: 13,
                  color: GREEN,
                  fontWeight: "700",
                  flex: 1,
                }}
              >
                🏷 {activeOrder.discountCode} — -{activeOrder.discountAmount}₴{" "}
                {lbl("indirim", "знижка", "discount", "скидка")}
              </Text>
            </View>
          )}

          {/* Kurye kazanç kartı */}
          {isPerOrder && perOrderAmt > 0 && (
            <View
              style={{
                marginHorizontal: 14,
                marginBottom: 14,
                backgroundColor: PURP + "10",
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                borderWidth: 1.5,
                borderColor: PURP + "25",
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: PURP + "18",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 24 }}>💵</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: PURP + "BB",
                    fontWeight: "700",
                  }}
                >
                  {lbl(
                    "Bu Teslimat Kazancın",
                    "Ваш дохід за доставку",
                    "Your Delivery Earnings",
                    "Ваш доход за доставку",
                  )}
                </Text>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "900",
                    color: PURP,
                    marginTop: 2,
                  }}
                >
                  {perOrderAmt.toFixed(0)}₴
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── NAVİGASYON BUTONU ── */}
        <Pressable
          onPress={openNav}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#0660A0" : BLUE,
            borderRadius: 20,
            paddingVertical: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 10,
            shadowColor: BLUE,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 18,
            elevation: 12,
          })}
        >
          <Ionicons name="navigate" size={24} color="#fff" />
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>
            {lbl(
              "Navigasyonu Başlat",
              "Навігація",
              "Start Navigation",
              "Навигация",
            )}
          </Text>
        </Pressable>

        {/* ── YOLA ÇIK ── */}
        {activeOrder.status === "accepted" && (
          <Pressable
            onPress={handleStart}
            disabled={delivering}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#14532D" : "#166534",
              borderRadius: 18,
              paddingVertical: 18,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 10,
              shadowColor: GREEN,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
              opacity: delivering ? 0.7 : 1,
            })}
          >
            {delivering ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="bicycle" size={24} color="#fff" />
                <Text
                  style={{ fontSize: 17, fontWeight: "900", color: "#fff" }}
                >
                  {lbl(
                    "Yola Çıktım 🚴",
                    "В дорозі 🚴",
                    "On My Way 🚴",
                    "В пути 🚴",
                  )}
                </Text>
              </>
            )}
          </Pressable>
        )}

        {/* ── TESLİM ET ── */}
        {isOnTheWay && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Pressable
              onPress={handleComplete}
              disabled={completing}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#14532D" : GREEN,
                borderRadius: 22,
                paddingVertical: 22,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                shadowColor: GREEN,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.55,
                shadowRadius: 20,
                elevation: 14,
                opacity: completing ? 0.7 : 1,
              })}
            >
              {completing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </View>
                  <Text
                    style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}
                  >
                    {lbl(
                      "Teslim Edildi ✅",
                      "Доставлено ✅",
                      "Delivered ✅",
                      "Доставлено ✅",
                    )}
                  </Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* ── ALT AKSIYONLAR ── */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <Pressable
            onPress={callCustomer}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 14,
              backgroundColor: BLUE + "10",
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: BLUE + "25",
            }}
          >
            <Ionicons name="call-outline" size={16} color={BLUE} />
            <Text style={{ fontSize: 13, color: BLUE, fontWeight: "700" }}>
              {lbl("Ara", "Зателефонувати", "Call", "Позвонить")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleCancel}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 14,
              backgroundColor: RED + "08",
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: RED + "20",
            }}
          >
            <Ionicons name="close-circle-outline" size={16} color={RED} />
            <Text style={{ fontSize: 13, color: RED, fontWeight: "700" }}>
              {lbl("İptal", "Скасувати", "Cancel", "Отменить")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
