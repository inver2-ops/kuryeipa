import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCourier } from "../../contexts/CourierContext";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { orders, historyOrders, language, courier } = useCourier();
  const dark = useColorScheme() === "dark";

  const BLUE = "#0A7EC8";
  const GREEN = "#16A34A";
  const RED = "#DC2626";
  const PURP = "#8B5CF6";
  const TXT = dark ? "#F0F8FF" : "#0A1929";
  const TXT2 = dark ? "rgba(240,248,255,0.6)" : "#3A6A8A";
  const TXT3 = dark ? "rgba(240,248,255,0.3)" : "#8CB8D0";
  const BG = dark ? "#050E1A" : "#EFF8FF";
  const CARD = dark ? "rgba(255,255,255,0.07)" : "#FFFFFF";
  const BDR = dark ? "rgba(255,255,255,0.09)" : "#C8DEF0";
  const INP = dark ? "rgba(255,255,255,0.05)" : "#F0F8FF";

  const [filter, setFilter] = useState<"all" | "delivered" | "cancelled">(
    "all",
  );

  const lbl = (tr_: string, uk_: string, en_: string, ru_: string) =>
    language === "tr"
      ? tr_
      : language === "uk"
        ? uk_
        : language === "ru"
          ? ru_
          : en_;

  // Tüm tamamlanmış siparişler (tekrarsız, en yeni önce)
  const allMap = new Map<string, any>();
  [...orders, ...historyOrders].forEach((o) => allMap.set(o.orderId, o));
  const finished = Array.from(allMap.values())
    .filter((o) => o.status === "delivered" || o.status === "cancelled")
    .sort(
      (a, b) =>
        new Date(b.deliveredAt || b.cancelledAt || b.date || 0).getTime() -
        new Date(a.deliveredAt || a.cancelledAt || a.date || 0).getTime(),
    );

  const filtered =
    filter === "all" ? finished : finished.filter((o) => o.status === filter);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayDone = finished.filter(
    (o) =>
      o.status === "delivered" &&
      (o.deliveredAt || o.date || "").startsWith(todayStr),
  );
  const todayKasa = todayDone.reduce((s, o) => s + (o.total || 0), 0);

  const isPerOrder =
    courier?.paymentType === "per_order" || !courier?.paymentType;
  const perOrderAmt = courier?.perOrderAmount || 0;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 14,
          paddingHorizontal: 18,
          backgroundColor: BLUE,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff" }}>
          📋 {lbl("Geçmiş", "Історія", "History", "История")}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.75)",
            marginTop: 2,
          }}
        >
          {finished.length} {lbl("sipariş", "замовлень", "orders", "заказов")}
        </Text>
        {todayDone.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>
                {lbl("Bugün", "Сьогодні", "Today", "Сегодня")}{" "}
                {todayDone.length}{" "}
                {lbl("teslimat", "доставок", "deliveries", "доставок")}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.18)",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>
                🏦 {todayKasa.toFixed(0)}₴
              </Text>
            </View>
            {isPerOrder && perOrderAmt > 0 && (
              <View
                style={{
                  backgroundColor: "rgba(139,92,246,0.35)",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "800", color: "#E9D5FF" }}
                >
                  💵 {(todayDone.length * perOrderAmt).toFixed(0)}₴
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Filtreler */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: CARD,
          borderBottomWidth: 1,
          borderBottomColor: BDR,
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 8,
        }}
      >
        {[
          { k: "all" as const, l: lbl("Tümü", "Всі", "All", "Все") },
          {
            k: "delivered" as const,
            l: lbl("✅ Teslim", "✅ Доставлено", "✅ Done", "✅ Доставлено"),
          },
          {
            k: "cancelled" as const,
            l: lbl("❌ İptal", "❌ Скасовано", "❌ Cancelled", "❌ Отменено"),
          },
        ].map((f) => (
          <Pressable
            key={f.k}
            onPress={() => setFilter(f.k)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 12,
              backgroundColor: filter === f.k ? BLUE + "18" : INP,
              borderWidth: 1.5,
              borderColor: filter === f.k ? BLUE : BDR,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: filter === f.k ? BLUE : TXT2,
              }}
            >
              {f.l}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 14,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 70 }}>
            <View
              style={{
                width: 78,
                height: 78,
                borderRadius: 39,
                backgroundColor: BLUE + "14",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <Ionicons name="time-outline" size={42} color={BLUE} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: TXT }}>
              {lbl("Geçmiş yok", "Немає історії", "No history", "Нет истории")}
            </Text>
          </View>
        ) : (
          filtered.map((o, i) => {
            const isDelivered = o.status === "delivered";
            const sc = isDelivered ? GREEN : RED;
            const dt = new Date(
              o.deliveredAt || o.cancelledAt || o.date || Date.now(),
            );
            const num = o.dailyOrderNumber ?? (o.orderId || "").slice(-4);
            const myEarning =
              isPerOrder && perOrderAmt > 0 && isDelivered ? perOrderAmt : 0;

            return (
              <View
                key={o.orderId || i}
                style={{
                  backgroundColor: CARD,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: isDelivered ? GREEN + "20" : BDR,
                  padding: 16,
                  marginBottom: 10,
                }}
              >
                {/* Üst satır */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "900",
                      color: BLUE,
                    }}
                  >
                    #{num}
                  </Text>
                  <Text style={{ fontSize: 11, color: TXT3, marginRight: 8 }}>
                    {dt.toLocaleString([], {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <View
                    style={{
                      backgroundColor: sc + "18",
                      borderRadius: 8,
                      paddingHorizontal: 9,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: sc + "35",
                    }}
                  >
                    <Text
                      style={{ fontSize: 11, fontWeight: "800", color: sc }}
                    >
                      {isDelivered
                        ? lbl(
                            "✅ TESLİM",
                            "✅ ДОСТАВЛЕНО",
                            "✅ DONE",
                            "✅ ДОСТАВЛЕНО",
                          )
                        : lbl(
                            "❌ İPTAL",
                            "❌ СКАСОВАНО",
                            "❌ CANCELLED",
                            "❌ ОТМЕНЕНО",
                          )}
                    </Text>
                  </View>
                </View>

                {/* Müşteri */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 6,
                  }}
                >
                  <Ionicons name="person-outline" size={14} color={BLUE} />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: "700",
                      color: TXT,
                    }}
                  >
                    {o.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: TXT3 }}>{o.phone}</Text>
                </View>

                {/* Adres */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 7,
                    marginBottom: 10,
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={RED}
                    style={{ marginTop: 1 }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: TXT2,
                      lineHeight: 19,
                    }}
                  >
                    {[o.city, o.street, o.building, o.flat ? `D:${o.flat}` : ""]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>

                {/* Özet: Litre + Kasa + Kurye kazancı */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    backgroundColor: INP,
                    borderRadius: 12,
                    padding: 10,
                  }}
                >
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{ fontSize: 9, color: TXT3, fontWeight: "700" }}
                    >
                      💧 {lbl("Litre", "Літр", "Litres", "Литр")}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: BLUE,
                        marginTop: 2,
                      }}
                    >
                      {o.liters}L
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={{ fontSize: 9, color: TXT3, fontWeight: "700" }}
                    >
                      🏦 {lbl("Kasa", "Каса", "Cash", "Касса")}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "900",
                        color: GREEN,
                        marginTop: 2,
                      }}
                    >
                      {(o.total || 0).toFixed(0)}₴
                    </Text>
                  </View>
                  {myEarning > 0 && (
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{ fontSize: 9, color: TXT3, fontWeight: "700" }}
                      >
                        💵 {lbl("Kazanç", "Дохід", "Earned", "Доход")}
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "900",
                          color: PURP,
                          marginTop: 2,
                        }}
                      >
                        {myEarning.toFixed(0)}₴
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
