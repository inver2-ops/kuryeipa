import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useCourier } from "../../contexts/CourierContext";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { orders, historyOrders, language, courier, statsSnapshot } = useCourier();
  const dark = useColorScheme() === "dark";

  const BLUE  = "#0A7EC8";
  const GREEN = "#16A34A";
  const PURP  = "#8B5CF6";
  const TXT   = dark ? "#F0F8FF" : "#0A1929";
  const TXT2  = dark ? "rgba(240,248,255,0.6)" : "#3A6A8A";
  const TXT3  = dark ? "rgba(240,248,255,0.3)" : "#8CB8D0";
  const BG    = dark ? "#050E1A" : "#EFF8FF";
  const CARD  = dark ? "rgba(255,255,255,0.07)" : "#FFFFFF";
  const BDR   = dark ? "rgba(255,255,255,0.09)" : "#C8DEF0";

  const [period, setPeriod] = useState<"today"|"week"|"month">("today");

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo  = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  // Tüm teslim edilmiş siparişler (aktif + geçmiş, tekrarsız)
  const allMap = new Map<string, any>();
  [...orders, ...historyOrders].forEach(o => allMap.set(o.orderId, o));
  const delivered = Array.from(allMap.values()).filter(o => o.status === "delivered");

  // kasaResetAt'tan sonraki = bekleyen kasa
  const kasaResetAt = courier?.kasaResetAt ? new Date(courier.kasaResetAt) : null;
  const pendingDelivered = kasaResetAt
    ? delivered.filter(o => new Date(o.deliveredAt || o.date || 0) > kasaResetAt)
    : delivered;

  const filterByPeriod = (arr: typeof delivered) => {
    if (period === "today") return arr.filter(o => (o.deliveredAt || o.date || "").startsWith(todayStr));
    if (period === "week")  return arr.filter(o => new Date(o.deliveredAt || o.date || 0) >= weekAgo);
    return arr.filter(o => new Date(o.deliveredAt || o.date || 0) >= monthAgo);
  };

  const filtered   = filterByPeriod(delivered);
  const litres     = filtered.reduce((s, o) => s + (o.liters || 0), 0);
  const pendingKasa = pendingDelivered.reduce((s, o) => s + (o.total || 0), 0);
  const kasa       = pendingKasa; // bekleyen kasa (sıfırlanır)
  const isPerOrder  = courier?.paymentType === "per_order" || !courier?.paymentType;
  const perOrderAmt = courier?.perOrderAmount || 0;
  // Snapshot: silinmiş siparişlerin birikimi (hiç sıfırlanmaz)
  const snap = statsSnapshot || { totalOrders: 0, totalKasa: 0, totalLiters: 0 };
  const totalDeliveredAllTime = delivered.length + snap.totalOrders;
  // Kazanç: TÜM zamanlar (mevcut + silinmişler), sıfırlanmaz
  const courierEarnings = isPerOrder ? totalDeliveredAllTime * perOrderAmt : (courier?.salaryAmount || 0);

  // Son 7 gün bar chart
  const daily = Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(now.getTime() - (6 - i) * 86400000);
    const ds = d.toISOString().slice(0, 10);
    const dayOrders = delivered.filter(o => (o.deliveredAt || o.date || "").startsWith(ds));
    return {
      day: d.toLocaleDateString([], { weekday: "short" }),
      count: dayOrders.length,
      kasa: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
      isToday: ds === todayStr,
    };
  });
  const maxCount = Math.max(...daily.map(d => d.count), 1);

  const lbl = (tr_: string, uk_: string, en_: string, ru_: string) =>
    language === "tr" ? tr_ : language === "uk" ? uk_ : language === "ru" ? ru_ : en_;

  const periods = [
    { k: "today" as const, l: lbl("Bugün", "Сьогодні", "Today", "Сегодня") },
    { k: "week"  as const, l: lbl("Bu Hafta", "Цей тиждень", "This Week", "Эта неделя") },
    { k: "month" as const, l: lbl("Bu Ay", "Цей місяць", "This Month", "Этот месяц") },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <View style={{ paddingTop: insets.top + 10, paddingBottom: 14, paddingHorizontal: 18, backgroundColor: BLUE }}>
        <Text style={{ fontSize: 22, fontWeight: "900", color: "#fff" }}>
          📊 {lbl("İstatistik", "Статистика", "Statistics", "Статистика")}
        </Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{courier?.name}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 90 }} showsVerticalScrollIndicator={false}>

        {/* Periyot seçici */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          {periods.map(p => (
            <Pressable key={p.k} onPress={() => { setPeriod(p.k); Haptics.selectionAsync(); }}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 14, alignItems: "center", backgroundColor: period === p.k ? BLUE+"18" : CARD, borderWidth: 1.5, borderColor: period === p.k ? BLUE : BDR }}>
              <Text style={{ fontSize: 12, fontWeight: "800", color: period === p.k ? BLUE : TXT2 }}>{p.l}</Text>
            </Pressable>
          ))}
        </View>

        {/* Ana istatistikler — Kasa + Kurye kazancı */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[
            { l: lbl("Teslimat", "Доставок", "Deliveries", "Доставок"), v: filtered.length, c: BLUE, icon: "📦" },
            { l: lbl("Litre", "Літрів", "Litres", "Литров"), v: Math.round(litres) + "L", c: "#0891B2", icon: "💧" },
            { l: lbl("Kasa", "Каса", "Cash", "Касса"), v: kasa.toFixed(0) + "₴", c: GREEN, icon: "🏦" },
          ].map((item, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: item.c+"0F", borderRadius: 18, borderWidth: 1.5, borderColor: item.c+"25", padding: 14, alignItems: "center" }}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              <Text style={{ fontSize: 9, fontWeight: "700", color: item.c, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 6 }}>{item.l}</Text>
              <Text style={{ fontSize: 20, fontWeight: "900", color: TXT, marginTop: 3 }}>{item.v}</Text>
            </View>
          ))}
        </View>

        {/* 2 ayrı kart: Bekleyen Kasa + Toplam Teslimat Kazancı */}
        <View style={{ flexDirection:"row", gap:10, marginBottom:14 }}>
          {/* Bekleyen net kasa (kasaResetAt'tan bu yana, sıfırlanır) */}
          <View style={{ flex:1, backgroundColor: GREEN+"0F", borderRadius:18, borderWidth:1.5, borderColor:GREEN+"30", padding:14, alignItems:"center" }}>
            <Text style={{ fontSize:22 }}>🏦</Text>
            <Text style={{ fontSize:11, color:GREEN, fontWeight:"700", marginTop:6, textTransform:"uppercase" }}>
              {lbl("Bekleyen Kasa","Очікувана каса","Pending Cash","Ожидающая касса")}
            </Text>
            <Text style={{ fontSize:26, fontWeight:"900", color:GREEN, marginTop:3 }}>{kasa.toFixed(0)}₴</Text>
            {isPerOrder && perOrderAmt > 0 && (
              <Text style={{ fontSize:11, color:TXT3, marginTop:4 }}>
                {lbl("Senin payın","Твоя частка","Your share","Твоя доля")}: -{(pendingDelivered.length*perOrderAmt).toFixed(0)}₴
              </Text>
            )}
            {kasaResetAt && <Text style={{ fontSize:10, color:TXT3, marginTop:3 }}>son sıfırlanma: {kasaResetAt.toLocaleDateString()}</Text>}
          </View>

          {/* Toplam teslimat başı kazanç (sıfırlanmaz) */}
          {isPerOrder && perOrderAmt > 0 && (
            <View style={{ flex:1, backgroundColor: PURP+"0F", borderRadius:18, borderWidth:1.5, borderColor:PURP+"30", padding:14, alignItems:"center" }}>
              <Text style={{ fontSize:22 }}>💵</Text>
              <Text style={{ fontSize:11, color:PURP, fontWeight:"700", marginTop:6, textTransform:"uppercase" }}>
                {lbl("Toplam Kazanç","Загалом","Total Earned","Всего заработано")}
              </Text>
              <Text style={{ fontSize:26, fontWeight:"900", color:PURP, marginTop:3 }}>{courierEarnings.toFixed(0)}₴</Text>
              <Text style={{ fontSize:11, color:TXT3, marginTop:4 }}>{totalDeliveredAllTime} × {perOrderAmt}₴</Text>
            </View>
          )}
        </View>

        {/* 7 günlük grafik */}
        <View style={{ backgroundColor: CARD, borderRadius: 22, borderWidth: 1, borderColor: BDR, padding: 18, marginBottom: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: "800", color: TXT2, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 18 }}>
            📈 {lbl("Son 7 Gün", "Останні 7 днів", "Last 7 Days", "Последние 7 дней")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, height: 90 }}>
            {daily.map((d, i) => {
              const h = d.count === 0 ? 5 : Math.max(12, (d.count / maxCount) * 78);
              return (
                <View key={i} style={{ flex: 1, alignItems: "center", gap: 5 }}>
                  {d.count > 0 && <Text style={{ fontSize: 10, fontWeight: "800", color: d.isToday ? BLUE : TXT3 }}>{d.count}</Text>}
                  <View style={{ height: h, width: "100%", backgroundColor: d.isToday ? BLUE : BLUE+"40", borderRadius: 6 }} />
                  <Text style={{ fontSize: 9, color: d.isToday ? BLUE : TXT3, fontWeight: d.isToday ? "800" : "400" }}>{d.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: BDR, paddingTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: TXT2 }}>{lbl("7 Günlük Toplam Kasa", "Каса за 7 днів", "7 Day Cash", "Касса за 7 дней")}</Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: GREEN }}>{daily.reduce((s, d) => s + d.kasa, 0).toFixed(0)}₴</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
