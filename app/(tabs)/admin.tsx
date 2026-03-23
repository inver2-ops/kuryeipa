import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCourier } from "../../contexts/CourierContext";
import { FLAGS, LANG_NAMES, Language } from "../../constants/translations";

const LANGS: Language[] = ["tr", "uk", "en", "ru"];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    courier,
    logout,
    language,
    setLanguage,
    orders,
    historyOrders,
    kasaTeslimTalep,
    statsSnapshot,
  } = useCourier();
  const dark = useColorScheme() === "dark";

  const BLUE = "#0A7EC8";
  const GREEN = "#16A34A";
  const RED = "#DC2626";
  const AMBER = "#D97706";
  const PURP = "#7C3AED";
  const TXT = dark ? "#F0F8FF" : "#0A1929";
  const TXT2 = dark ? "rgba(240,248,255,0.6)" : "#3A6A8A";
  const TXT3 = dark ? "rgba(240,248,255,0.3)" : "#8CB8D0";
  const BG = dark ? "#050E1A" : "#EFF8FF";
  const CARD = dark ? "#0C1E33" : "#FFFFFF";
  const BDR = dark ? "rgba(255,255,255,0.09)" : "#C8DEF0";

  const lbl = (tr_: string, uk_: string, en_: string, ru_: string) =>
    language === "tr"
      ? tr_
      : language === "uk"
        ? uk_
        : language === "ru"
          ? ru_
          : en_;

  // Hesaplamalar — kendi siparişlerinden
  const allMap = new Map<string, any>();
  [...orders, ...historyOrders].forEach((o) => allMap.set(o.orderId, o));
  const allDone = Array.from(allMap.values()).filter(
    (o) => o.status === "delivered",
  );

  // kasaResetAt'tan sonraki = bekleyen kasa (sıfırlanır)
  const kasaResetAt = courier?.kasaResetAt
    ? new Date(courier.kasaResetAt)
    : null;
  const pendingDone = kasaResetAt
    ? allDone.filter(
        (o) => new Date(o.deliveredAt || o.date || 0) > kasaResetAt,
      )
    : allDone;

  const totalEarnings = allDone.reduce((s, o) => s + (o.total || 0), 0);
  const totalLiters = allDone.reduce((s, o) => s + (o.liters || 0), 0);
  const totalOrders = allDone.length;
  const pendingKasaBrut = pendingDone.reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrderCount = pendingDone.length;
  const isPerOrder =
    courier?.paymentType === "per_order" || !courier?.paymentType;
  const perOrderAmt = courier?.perOrderAmount || 0;
  const snap = statsSnapshot || {
    totalOrders: 0,
    totalKasa: 0,
    totalLiters: 0,
    totalCourierEarnings: 0,
  };
  const totalOrdersAllTime = totalOrders + snap.totalOrders;
  const allTimeCourierEarnings = isPerOrder
    ? totalOrdersAllTime * perOrderAmt
    : courier?.salaryAmount || 0;
  const pendingCourierEarnings = isPerOrder
    ? pendingOrderCount * perOrderAmt
    : courier?.salaryAmount || 0;
  const netKasaTeslim = isPerOrder
    ? pendingKasaBrut - pendingCourierEarnings
    : pendingKasaBrut;

  // Son 24 saat (gece 00:00 değil, tam 24 saat önce)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const todayDone = allDone.filter(
    (o) => new Date(o.deliveredAt || o.date || 0) >= last24h,
  );

  const [kasaTalepLoading, setKasaTalepLoading] = useState(false);
  const [kasaTalepDone, setKasaTalepDone] = useState(false);

  const handleLogout = () =>
    Alert.alert(
      lbl("Çıkış Yap", "Вийти", "Log Out", "Выйти"),
      lbl("Emin misin?", "Впевнений?", "Are you sure?", "Уверен?"),
      [
        {
          text: lbl("İptal", "Скасувати", "Cancel", "Отмена"),
          style: "cancel",
        },
        {
          text: lbl("Çıkış", "Вийти", "Log Out", "Выйти"),
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
            router.replace("/");
          },
        },
      ],
    );

  const handleKasaTeslim = () => {
    Alert.alert(
      lbl(
        "💰 Kasa Teslim Talebi",
        "💰 Запит на передачу каси",
        "💰 Cash Handover Request",
        "💰 Запрос передачи кассы",
      ),
      lbl(
        `Teslim edilecek net kasa: ${netKasaTeslim.toFixed(0)}₴\n\nAdmin onayladıktan sonra kasan sıfırlanacak.`,
        `Сума до передачі: ${netKasaTeslim.toFixed(0)}₴\n\nПісля підтвердження адміном касу буде скинуто.`,
        `Net cash to hand over: ${netKasaTeslim.toFixed(0)}₴\n\nAdmin will confirm receipt.`,
        `Сумма для передачи: ${netKasaTeslim.toFixed(0)}₴\n\nПосле подтверждения администратором касса будет сброшена.`,
      ),
      [
        {
          text: lbl("İptal", "Скасувати", "Cancel", "Отмена"),
          style: "cancel",
        },
        {
          text: lbl("Gönder", "Надіслати", "Send", "Отправить"),
          onPress: async () => {
            setKasaTalepLoading(true);
            await kasaTeslimTalep();
            setKasaTalepDone(true);
            setKasaTalepLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  const Section = ({
    title,
    children,
  }: {
    title?: string;
    children: React.ReactNode;
  }) => (
    <View style={{ marginBottom: 14 }}>
      {!!title && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: TXT3,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            paddingHorizontal: 20,
            marginBottom: 6,
          }}
        >
          {title}
        </Text>
      )}
      <View
        style={{
          backgroundColor: CARD,
          borderRadius: 18,
          marginHorizontal: 16,
          borderWidth: 1,
          borderColor: BDR,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );

  const Row = ({
    icon,
    color = BLUE,
    label,
    value,
    onPress,
    danger = false,
  }: {
    icon: string;
    color?: string;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 15,
        paddingHorizontal: 16,
        backgroundColor:
          pressed && onPress
            ? dark
              ? "rgba(255,255,255,0.04)"
              : "#F0F8FF"
            : "transparent",
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: (danger ? RED : color) + "18",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon as any} size={18} color={danger ? RED : color} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          color: danger ? RED : TXT,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
      {value ? (
        <Text style={{ fontSize: 12, color: TXT3 }} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={TXT3} />
      ) : null}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: dark ? "#060F1C" : "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: BDR,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "900", color: TXT }}>
          {lbl("Ayarlar", "Налаштування", "Settings", "Настройки")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profil kartı ── */}
        <View
          style={{
            backgroundColor: BLUE,
            borderRadius: 22,
            marginHorizontal: 16,
            marginBottom: 14,
            padding: 20,
            shadowColor: BLUE,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.4)",
              }}
            >
              <Text style={{ fontSize: 30 }}>
                {courier?.gender === "female" ? "👩" : "👨"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>
                {courier?.name || "Kurye"}
              </Text>
              {!!courier?.phone && (
                <Text
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.75)",
                    marginTop: 2,
                  }}
                >
                  {courier.phone}
                </Text>
              )}
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <Text
                    style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}
                  >
                    {isPerOrder
                      ? `📦 ${perOrderAmt}₴ / ${lbl("teslimat başı", "за доставку", "per delivery", "за доставку")}`
                      : `💼 ${courier?.salaryAmount || 0}₴ / ${lbl("aylık maaş", "місячна зп", "monthly salary", "ежемес. зп")}`}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.6)",
                      marginTop: 3,
                    }}
                  >
                    {isPerOrder
                      ? lbl(
                          `Her teslimat için ${perOrderAmt}₴ alıyorsun`,
                          `За кожну доставку ти отримуєш ${perOrderAmt}₴`,
                          `You earn ${perOrderAmt}₴ per delivery`,
                          `За каждую доставку ты получаешь ${perOrderAmt}₴`,
                        )
                      : lbl(
                          `Aylık sabit maaş: ${courier?.salaryAmount || 0}₴`,
                          `Фіксована місячна зп: ${courier?.salaryAmount || 0}₴`,
                          `Fixed monthly salary: ${courier?.salaryAmount || 0}₴`,
                          `Фиксированная мес. зп: ${courier?.salaryAmount || 0}₴`,
                        )}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3 istatistik */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            {[
              {
                icon: "📦",
                lbl: lbl("Teslimat", "Доставок", "Orders", "Доставок"),
                val: String(totalOrdersAllTime),
              },
              { icon: "🏦", lbl: "Kasa", val: totalEarnings.toFixed(0) + "₴" },
              {
                icon: "💧",
                lbl: lbl("Litre", "Літрів", "Litres", "Литров"),
                val: totalLiters + "L",
              },
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  borderRadius: 14,
                  padding: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.25)",
                }}
              >
                <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: "#fff",
                    marginTop: 3,
                  }}
                >
                  {item.val}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 1,
                  }}
                >
                  {item.lbl}
                </Text>
              </View>
            ))}
          </View>

          {/* Kurye kazancı (paket başı) */}
          {isPerOrder && perOrderAmt > 0 && (
            <View
              style={{
                backgroundColor: "rgba(139,92,246,0.3)",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                borderWidth: 1,
                borderColor: "rgba(139,92,246,0.5)",
              }}
            >
              <Text style={{ fontSize: 22 }}>💵</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 11, color: "#E9D5FF", fontWeight: "700" }}
                >
                  {lbl(
                    "Senin Kazancın",
                    "Твій дохід",
                    "Your Earnings",
                    "Твой доход",
                  )}
                </Text>
                <Text
                  style={{ fontSize: 22, fontWeight: "900", color: "#fff" }}
                >
                  {allTimeCourierEarnings.toFixed(0)}₴
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                  {totalOrdersAllTime}{" "}
                  {lbl("teslimat", "доставок", "deliveries", "доставок")} ×{" "}
                  {perOrderAmt}₴ (
                  {lbl("tüm zamanlar", "всього", "all time", "всего")})
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── KASA TESLİM KARTI ── */}
        {pendingKasaBrut > 0 && (
          <View
            style={{
              backgroundColor: dark ? "#0C1E33" : "#FFFFFF",
              borderRadius: 22,
              marginHorizontal: 16,
              marginBottom: 14,
              borderWidth: 2,
              borderColor: kasaTalepDone ? GREEN + "60" : AMBER + "60",
              overflow: "hidden",
              shadowColor: AMBER,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {/* Başlık */}
            <View
              style={{
                backgroundColor: kasaTalepDone ? GREEN : AMBER,
                paddingHorizontal: 18,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 20 }}>
                {kasaTalepDone ? "✅" : "💰"}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "900",
                  color: "#fff",
                  flex: 1,
                }}
              >
                {kasaTalepDone
                  ? lbl(
                      "Teslim Talebi Gönderildi",
                      "Запит надіслано",
                      "Request Sent",
                      "Запрос отправлен",
                    )
                  : lbl(
                      "Kasa Teslim",
                      "Передача каси",
                      "Cash Handover",
                      "Передача кассы",
                    )}
              </Text>
            </View>

            <View style={{ padding: 16, gap: 10 }}>
              {/* Kasa detayları */}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: BLUE + "0C",
                    borderRadius: 12,
                    padding: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: BLUE + "18",
                  }}
                >
                  <Text
                    style={{ fontSize: 10, color: TXT3, fontWeight: "700" }}
                  >
                    🏦 {lbl("Brüt Kasa", "Каса", "Gross Cash", "Касса")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "900",
                      color: BLUE,
                      marginTop: 3,
                    }}
                  >
                    {pendingKasaBrut.toFixed(0)}₴
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: PURP + "0C",
                    borderRadius: 12,
                    padding: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: PURP + "18",
                  }}
                >
                  <Text
                    style={{ fontSize: 10, color: TXT3, fontWeight: "700" }}
                  >
                    💵{" "}
                    {lbl(
                      "Senin Payın",
                      "Твоя частка",
                      "Your Share",
                      "Твоя доля",
                    )}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "900",
                      color: PURP,
                      marginTop: 3,
                    }}
                  >
                    -{allTimeCourierEarnings.toFixed(0)}₴
                  </Text>
                </View>
              </View>

              {/* Net kasa — büyük */}
              <View
                style={{
                  backgroundColor: GREEN + "0C",
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  borderWidth: 1.5,
                  borderColor: GREEN + "30",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: GREEN + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 24 }}>🏪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 12, color: TXT2, fontWeight: "700" }}
                  >
                    {lbl(
                      "Dükkana Teslim Edilecek",
                      "До передачі в магазин",
                      "To Hand Over",
                      "К передаче в магазин",
                    )}
                  </Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "900",
                      color: GREEN,
                      marginTop: 2,
                    }}
                  >
                    {netKasaTeslim > 0 ? netKasaTeslim.toFixed(0) : "0"}₴
                  </Text>
                </View>
              </View>

              {/* Teslim et butonu */}
              {!kasaTalepDone ? (
                <Pressable
                  onPress={handleKasaTeslim}
                  disabled={kasaTalepLoading}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#92400E" : AMBER,
                    borderRadius: 16,
                    paddingVertical: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: kasaTalepLoading ? 0.7 : 1,
                    shadowColor: AMBER,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                  })}
                >
                  {kasaTalepLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={{ fontSize: 18 }}>💰</Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "900",
                          color: "#fff",
                        }}
                      >
                        {lbl(
                          "Kasayı Teslim Et",
                          "Передати касу",
                          "Hand Over Cash",
                          "Передать кассу",
                        )}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : (
                <View
                  style={{
                    backgroundColor: GREEN + "15",
                    borderRadius: 16,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: GREEN + "30",
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color={GREEN} />
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", color: GREEN }}
                  >
                    {lbl(
                      "Admin onayı bekleniyor...",
                      "Очікується підтвердження...",
                      "Awaiting admin confirmation...",
                      "Ожидается подтверждение...",
                    )}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 24 saatlik özet */}
        <View style={{ marginHorizontal: 16, marginBottom: 14 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: TXT3,
              textTransform: "uppercase",
              letterSpacing: 0.7,
              marginBottom: 8,
            }}
          >
            ⏰{" "}
            {lbl(
              "Son 24 Saat",
              "Останні 24 год",
              "Last 24 Hours",
              "Последние 24 ч",
            )}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                lbl: lbl("Teslimat", "Доставок", "Orders", "Доставок"),
                val: String(todayDone.length),
                color: BLUE,
                icon: "📦",
              },
              {
                lbl: lbl("Litre", "Літрів", "Litres", "Литров"),
                val: todayDone.reduce((s, o) => s + (o.liters || 0), 0) + "L",
                color: "#0891B2",
                icon: "💧",
              },
              {
                lbl: lbl("Kasa", "Каса", "Cash", "Касса"),
                val:
                  todayDone.reduce((s, o) => s + (o.total || 0), 0).toFixed(0) +
                  "₴",
                color: GREEN,
                icon: "🏦",
              },
              ...(isPerOrder && perOrderAmt > 0
                ? [
                    {
                      lbl: lbl("Kazanç", "Дохід", "Earned", "Доход"),
                      val: (todayDone.length * perOrderAmt).toFixed(0) + "₴",
                      color: PURP,
                      icon: "💵",
                    },
                  ]
                : [
                    {
                      lbl: lbl("Bekl. Kasa", "Очікує", "Pending", "Ожидает"),
                      val: pendingKasaBrut.toFixed(0) + "₴",
                      color: AMBER,
                      icon: "💰",
                    },
                  ]),
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  width: "48%",
                  backgroundColor: CARD,
                  borderRadius: 14,
                  padding: 10,
                  borderWidth: 1,
                  borderColor: BDR,
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: TXT3,
                    marginTop: 3,
                    marginBottom: 1,
                    textAlign: "center",
                  }}
                >
                  {item.lbl}
                </Text>
                <Text
                  style={{ fontSize: 18, fontWeight: "900", color: item.color }}
                >
                  {item.val}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Dil */}
        <Section title={lbl("Dil", "Мова", "Language", "Язык")}>
          <View style={{ padding: 14 }}>
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {LANGS.map((l) => (
                <Pressable
                  key={l}
                  onPress={() => {
                    setLanguage(l);
                    Haptics.selectionAsync();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    borderWidth: 2,
                    backgroundColor:
                      l === language ? BLUE + "18" : "transparent",
                    borderColor: l === language ? BLUE : BDR,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{FLAGS[l]}</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: l === language ? BLUE : TXT2,
                    }}
                  >
                    {LANG_NAMES[l]}
                  </Text>
                  {l === language && (
                    <Ionicons name="checkmark-circle" size={14} color={BLUE} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Section>

        {/* Çıkış */}
        <Section>
          <Row
            icon="log-out-outline"
            label={lbl("Çıkış Yap", "Вийти", "Log Out", "Выйти")}
            onPress={handleLogout}
            danger
          />
        </Section>

        <Text
          style={{
            textAlign: "center",
            fontSize: 11,
            color: TXT3,
            marginTop: 8,
          }}
        >
          INVER Courier v1.0
        </Text>
      </ScrollView>
    </View>
  );
}
