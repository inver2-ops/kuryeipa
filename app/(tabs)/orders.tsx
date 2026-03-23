import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Vibration,
  useColorScheme,
  Animated,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Updates from "expo-updates";
import { useCourier } from "../../contexts/CourierContext";

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const {
    pendingOrders,
    acceptOrder,
    rejectOrder,
    refreshOrders,
    language,
    courier,
    isRefreshing,
    newOrderAlert,
    clearNewOrderAlert,
    appName,
  } = useCourier();
  const isPerOrder =
    courier?.paymentType === "per_order" || !courier?.paymentType;
  const perOrderAmt = courier?.perOrderAmount || 0;
  const dark = useColorScheme() === "dark";

  const BLUE = "#0A7EC8";
  const BLUE2 = "#0560A0";
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

  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [otaModal, setOtaModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) setOtaModal(true);
      } catch (_e) {
        // Expo Go veya ağ hatası — sessizce geç
      }
    })();
  }, []);

  const doUpdate = async () => {
    setUpdating(true);
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!newOrderAlert) return;
    Vibration.vibrate([0, 300, 150, 300, 150, 500]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 6 },
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 8 },
    ).start();
    clearNewOrderAlert();
  }, [newOrderAlert]);

  const lbl = (tr_: string, uk_: string, en_: string, ru_: string) =>
    language === "tr"
      ? tr_
      : language === "uk"
        ? uk_
        : language === "ru"
          ? ru_
          : en_;

  const handleAccept = (orderId: string) =>
    Alert.alert(
      lbl("✅ Siparişi Kabul Et", "✅ Прийняти", "✅ Accept", "✅ Принять"),
      lbl(
        "Bu siparişi almak istiyor musun?",
        "Прийняти це замовлення?",
        "Accept this order?",
        "Принять этот заказ?",
      ),
      [
        {
          text: lbl("İptal", "Скасувати", "Cancel", "Отмена"),
          style: "cancel",
        },
        {
          text: lbl("Kabul Et", "Прийняти", "Accept", "Принять"),
          onPress: async () => {
            setAccepting(orderId);
            await acceptOrder(orderId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setAccepting(null);
          },
        },
      ],
    );

  const handleReject = (orderId: string) =>
    Alert.alert(
      lbl("❌ Reddet", "❌ Відхилити", "❌ Reject", "❌ Отклонить"),
      lbl(
        "Bu siparişi reddetmek istiyor musun?",
        "Відхилити це замовлення?",
        "Reject this order?",
        "Отклонить этот заказ?",
      ),
      [
        {
          text: lbl("İptal", "Скасувати", "Cancel", "Отмена"),
          style: "cancel",
        },
        {
          text: lbl("Reddet", "Відхилити", "Reject", "Отклонить"),
          style: "destructive",
          onPress: async () => {
            setRejecting(orderId);
            await rejectOrder(orderId);
            Haptics.selectionAsync();
            setRejecting(null);
          },
        },
      ],
    );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* ── HEADER ── */}
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: dark ? "#060F1C" : "#fff",
          borderBottomWidth: 1,
          borderBottomColor: BDR,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 18,
            paddingVertical: 14,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: BLUE + "18",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderColor: BLUE + "30",
            }}
          >
            <Text style={{ fontSize: 22 }}>🚚</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "900",
                color: TXT,
                letterSpacing: -0.3,
              }}
            >
              {appName}
            </Text>
            <Text style={{ fontSize: 12, color: TXT3, marginTop: 1 }}>
              {courier?.name}
            </Text>
          </View>
          <Pressable
            onPress={refreshOrders}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: BLUE + "12",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: BLUE + "25",
            }}
          >
            {isRefreshing ? (
              <ActivityIndicator color={BLUE} size="small" />
            ) : (
              <Ionicons name="refresh" size={18} color={BLUE} />
            )}
          </Pressable>
        </View>

        {/* Sipariş sayacı banner */}
        {pendingOrders.length > 0 && (
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              marginHorizontal: 16,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                backgroundColor: BLUE,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                shadowColor: BLUE,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.5,
                shadowRadius: 14,
                elevation: 10,
              }}
            >
              <Animated.View
                style={{
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1],
                  }),
                }}
              >
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
                  <Text style={{ fontSize: 18 }}>🔔</Text>
                </View>
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}
                >
                  {pendingOrders.length}{" "}
                  {lbl(
                    "yeni sipariş bekliyor!",
                    "нових замовлень!",
                    "new orders waiting!",
                    "новых заказов!",
                  )}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 2,
                  }}
                >
                  {lbl(
                    "Hemen kontrol et",
                    "Перевір зараз",
                    "Check now",
                    "Проверь сейчас",
                  )}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.25)",
                  borderRadius: 12,
                  width: 36,
                  height: 36,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}
                >
                  {pendingOrders.length}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 14,
          paddingBottom: insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Boş durum */}
        {pendingOrders.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 80, gap: 16 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: BLUE + "10",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: BLUE + "20",
                borderStyle: "dashed",
              }}
            >
              <Text style={{ fontSize: 48 }}>🛵</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: "900", color: TXT }}>
              {lbl(
                "Sipariş bekleniyor",
                "Очікування замовлень",
                "Waiting for orders",
                "Ожидание заказов",
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
                "Yeni sipariş geldiğinde\nburada görünecek ve titreşecek",
                "Нове замовлення з'явиться тут",
                "New orders will appear here",
                "Новые заказы появятся здесь",
              )}
            </Text>
            <Pressable
              onPress={refreshOrders}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: CARD,
                borderRadius: 16,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderWidth: 1.5,
                borderColor: BLUE + "30",
                opacity: pressed ? 0.7 : 1,
                shadowColor: BLUE,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 4,
              })}
            >
              <Ionicons name="refresh-outline" size={18} color={BLUE} />
              <Text style={{ fontSize: 15, color: BLUE, fontWeight: "700" }}>
                {lbl("Yenile", "Оновити", "Refresh", "Обновить")}
              </Text>
            </Pressable>
          </View>
        ) : (
          pendingOrders.map((o) => {
            const addr = [
              o.city,
              o.street,
              o.building,
              o.flat ? `D:${o.flat}` : "",
            ]
              .filter(Boolean)
              .join(", ");
            const timeDiff = Math.floor(
              (Date.now() -
                new Date(o.date || o.savedAt || Date.now()).getTime()) /
                60000,
            );
            const num = o.dailyOrderNumber ?? (o.orderId || "").slice(-4);
            const isNew = timeDiff < 5;

            return (
              <View
                key={o.orderId}
                style={{
                  marginBottom: 16,
                  shadowColor: isNew ? BLUE : "#000",
                  shadowOffset: { width: 0, height: isNew ? 12 : 4 },
                  shadowOpacity: isNew ? 0.3 : 0.1,
                  shadowRadius: isNew ? 20 : 8,
                  elevation: isNew ? 12 : 4,
                }}
              >
                <View
                  style={{
                    borderRadius: 24,
                    overflow: "hidden",
                    borderWidth: isNew ? 2 : 1,
                    borderColor: isNew ? BLUE : BDR,
                  }}
                >
                  {/* ── Kart başlık bandı ── */}
                  <View
                    style={{
                      backgroundColor: BLUE,
                      paddingHorizontal: 18,
                      paddingVertical: 14,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        {isNew && (
                          <View
                            style={{
                              backgroundColor: "#FBBF24",
                              borderRadius: 8,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: "900",
                                color: "#000",
                              }}
                            >
                              YENİ
                            </Text>
                          </View>
                        )}
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "900",
                            color: "#fff",
                          }}
                        >
                          Sipariş #{num}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="rgba(255,255,255,0.7)"
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.8)",
                            fontWeight: "600",
                          }}
                        >
                          {timeDiff < 1
                            ? lbl("az önce", "щойно", "just now", "только что")
                            : `${timeDiff} dk`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* ── Kart içeriği ── */}
                  <View style={{ backgroundColor: CARD, padding: 16, gap: 10 }}>
                    {/* Müşteri satırı */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: BLUE + "15",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1.5,
                          borderColor: BLUE + "25",
                        }}
                      >
                        <Ionicons name="person" size={22} color={BLUE} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "900",
                            color: TXT,
                          }}
                        >
                          {o.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: BLUE,
                            fontWeight: "600",
                            marginTop: 2,
                          }}
                        >
                          📞 {o.phone}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: GREEN + "12",
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderWidth: 1.5,
                          borderColor: GREEN + "30",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: GREEN,
                            fontWeight: "700",
                            marginBottom: 1,
                          }}
                        >
                          🏦 Kasa
                        </Text>
                        <Text
                          style={{
                            fontSize: 19,
                            fontWeight: "900",
                            color: GREEN,
                          }}
                        >
                          {(o.total || 0).toFixed(0)}₴
                        </Text>
                      </View>
                    </View>

                    {/* Adres */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 10,
                        backgroundColor: RED + "08",
                        borderRadius: 14,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: RED + "15",
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: RED + "15",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 1,
                        }}
                      >
                        <Ionicons name="location" size={14} color={RED} />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: TXT,
                          lineHeight: 21,
                          fontWeight: "500",
                        }}
                      >
                        {addr}
                      </Text>
                    </View>

                    {/* Detaylar */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: BLUE + "0C",
                          borderRadius: 14,
                          padding: 12,
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: BLUE + "18",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: BLUE,
                            fontWeight: "700",
                          }}
                        >
                          💧 {lbl("Su", "Вода", "Water", "Вода")}
                        </Text>
                        <Text
                          style={{
                            fontSize: 24,
                            fontWeight: "900",
                            color: BLUE,
                            marginTop: 4,
                          }}
                        >
                          {o.liters}L
                        </Text>
                      </View>
                      {(o.deposits || 0) > 0 && (
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: AMBER + "0C",
                            borderRadius: 14,
                            padding: 12,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: AMBER + "18",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: AMBER,
                              fontWeight: "700",
                            }}
                          >
                            🫙 {lbl("Şişe", "Каністра", "Bottle", "Канистра")}
                          </Text>
                          <Text
                            style={{
                              fontSize: 24,
                              fontWeight: "900",
                              color: AMBER,
                              marginTop: 4,
                            }}
                          >
                            ×{o.deposits}
                          </Text>
                        </View>
                      )}
                      {o.discountCode && (
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: GREEN + "0C",
                            borderRadius: 14,
                            padding: 12,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: GREEN + "18",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: GREEN,
                              fontWeight: "700",
                            }}
                          >
                            🏷 {lbl("İndirim", "Знижка", "Discount", "Скидка")}
                          </Text>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "900",
                              color: GREEN,
                              marginTop: 4,
                            }}
                          >
                            -{o.discountAmount}₴
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Kurye kazanç bandı */}
                    {isPerOrder && perOrderAmt > 0 && (
                      <View
                        style={{
                          backgroundColor: PURP + "10",
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          borderWidth: 1.5,
                          borderColor: PURP + "25",
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: PURP + "18",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 20 }}>💵</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: PURP + "CC",
                              fontWeight: "700",
                            }}
                          >
                            {lbl(
                              "Kabul edersen kazanacaksın",
                              "Якщо приймеш — заробиш",
                              "Your earnings if accepted",
                              "Заработаешь если примешь",
                            )}
                          </Text>
                          <Text
                            style={{
                              fontSize: 22,
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

                    {/* Butonlar */}
                    <View
                      style={{ flexDirection: "row", gap: 10, marginTop: 4 }}
                    >
                      <Pressable
                        onPress={() => handleReject(o.orderId)}
                        disabled={rejecting === o.orderId}
                        style={({ pressed }) => ({
                          flex: 1,
                          backgroundColor: pressed ? "#991B1B" : RED + "18",
                          borderRadius: 16,
                          paddingVertical: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          borderWidth: 1.5,
                          borderColor: RED + "40",
                          opacity: rejecting === o.orderId ? 0.5 : 1,
                        })}
                      >
                        {rejecting === o.orderId ? (
                          <ActivityIndicator color={RED} size="small" />
                        ) : (
                          <>
                            <Ionicons
                              name="close-circle"
                              size={18}
                              color={RED}
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "800",
                                color: RED,
                              }}
                            >
                              {lbl(
                                "Reddet",
                                "Відхилити",
                                "Reject",
                                "Отклонить",
                              )}
                            </Text>
                          </>
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => handleAccept(o.orderId)}
                        disabled={accepting === o.orderId}
                        style={({ pressed }) => ({
                          flex: 2,
                          backgroundColor: pressed ? "#14532D" : GREEN,
                          borderRadius: 16,
                          paddingVertical: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          shadowColor: GREEN,
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.45,
                          shadowRadius: 14,
                          elevation: 8,
                          opacity: accepting === o.orderId ? 0.7 : 1,
                        })}
                      >
                        {accepting === o.orderId ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color="#fff"
                            />
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "900",
                                color: "#fff",
                              }}
                            >
                              {lbl("Kabul Et", "Прийняти", "Accept", "Принять")}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* OTA Güncelleme Modal */}
      <Modal visible={otaModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: CARD,
              borderRadius: 28,
              padding: 28,
              width: "100%",
              maxWidth: 380,
              alignItems: "center",
              borderWidth: 2,
              borderColor: BLUE,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: BLUE + "15",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="cloud-download" size={36} color={BLUE} />
            </View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "900",
                color: TXT,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              {lbl(
                "Güncelleme Hazır",
                "Оновлення готове",
                "Update Ready",
                "Обновление готово",
              )}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: TXT2,
                textAlign: "center",
                lineHeight: 20,
                marginBottom: 24,
              }}
            >
              {lbl(
                "Yeni sürüm mevcut. Şimdi güncelleyin.",
                "Доступна нова версія.",
                "New version available.",
                "Новая версия доступна.",
              )}
            </Text>
            <Pressable
              onPress={doUpdate}
              disabled={updating}
              style={{
                backgroundColor: BLUE,
                borderRadius: 16,
                paddingVertical: 16,
                width: "100%",
                alignItems: "center",
                marginBottom: 10,
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {updating ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {lbl(
                      "Güncelleniyor...",
                      "Оновлення...",
                      "Updating...",
                      "Обновление...",
                    )}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="download" size={18} color="#fff" />
                  <Text
                    style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}
                  >
                    {lbl("Güncelle", "Оновити", "Update", "Обновить")}
                  </Text>
                </>
              )}
            </Pressable>
            {!updating && (
              <Pressable
                onPress={() => setOtaModal(false)}
                style={{ paddingVertical: 8 }}
              >
                <Text style={{ color: TXT3, fontSize: 13 }}>
                  {lbl("Sonra", "Пізніше", "Later", "Позже")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
