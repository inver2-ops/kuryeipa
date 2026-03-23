import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
  useColorScheme,
  Animated,
  Alert,
  Modal,
  Switch,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCourier } from "../contexts/CourierContext";
import { FLAGS, Language } from "../constants/translations";

const LANGS: Language[] = ["tr", "uk", "en", "ru"];

type AdminTab = "couriers" | "orders" | "stats" | "settings";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const {
    isLoaded,
    courier,
    login,
    language,
    setLanguage,
    workerUrl,
    setWorkerUrl,
    appName,
    setAppName,
  } = useCourier();
  const dark = useColorScheme() === "dark";
  const BG = dark ? "#050D1A" : "#EFF8FF";
  const CARD = dark ? "rgba(255,255,255,0.07)" : "#FFFFFF";
  const TXT = dark ? "#F0F8FF" : "#0A1929";
  const TXT2 = dark ? "rgba(240,248,255,0.55)" : "#3A6A8A";
  const TXT3 = dark ? "rgba(240,248,255,0.28)" : "#8CB8D0";
  const INP = dark ? "rgba(255,255,255,0.08)" : "#E2F0FA";
  const BDR = dark ? "rgba(255,255,255,0.10)" : "#C8DEF0";
  const BLUE = "#0A7EC8";
  const GREEN = "#16A34A";
  const RED = "#DC2626";
  const AMBER = "#D97706";
  const PURP = "#8B5CF6";

  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Gizli admin
  const [logoTaps, setLogoTaps] = useState(0);
  const tapTimer = useRef<any>(null);
  const [adminModal, setAdminModal] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("couriers");
  const [adminLoading, setAdminLoading] = useState(false);

  // Kurye verileri
  const [_couriers, setCouriers] = useState<any[]>([]);
  const [courierStats, setCourierStats] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCPw, setNewCPw] = useState("");
  const [paymentType, setPaymentType] = useState<"per_order" | "salary">(
    "per_order",
  );
  const [perOrderAmount, setPerOrderAmount] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [addingC, setAddingC] = useState(false);

  // Kurye düzenleme
  const [editingCourier, setEditingCourier] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPw, setEditPw] = useState("");
  const [editPayType, setEditPayType] = useState<"per_order" | "salary">(
    "per_order",
  );
  const [editPerAmt, setEditPerAmt] = useState("");
  const [editSalAmt, setEditSalAmt] = useState("");
  const [editGender, setEditGender] = useState<"male" | "female">("male");
  const [savingEdit, setSavingEdit] = useState(false);

  // Sipariş verileri
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<
    "all" | "delivered" | "cancelled" | "pending"
  >("all");

  // Uygulama ayarları
  const [editAppName, setEditAppName] = useState(appName);
  const [editWorkerUrl, setEditWorkerUrl] = useState(workerUrl);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (isLoaded && courier) router.replace("/(tabs)/orders");
  }, [isLoaded, courier]);

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 12,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -12,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const L: Record<Language, any> = {
    tr: {
      sub: "Kurye Girişi",
      btn: "Giriş Yap",
      connect: "Bağlanıyor...",
      pw: "Şifre",
      remember: "Şifremi hatırla",
      auto: "Otomatik giriş",
    },
    uk: {
      sub: "Вхід кур'єра",
      btn: "Увійти",
      connect: "Підключення...",
      pw: "Пароль",
      remember: "Запам'ятати",
      auto: "Автовхід",
    },
    en: {
      sub: "Courier Sign In",
      btn: "Sign In",
      connect: "Connecting...",
      pw: "Password",
      remember: "Remember me",
      auto: "Auto login",
    },
    ru: {
      sub: "Вход курьера",
      btn: "Войти",
      connect: "Подключение...",
      pw: "Пароль",
      remember: "Запомнить",
      auto: "Авто вход",
    },
  };
  const Lc = L[language];

  const handleLogin = async () => {
    if (!pw.trim()) {
      shake();
      setError("Şifre boş olamaz");
      return;
    }
    setLoading(true);
    setError("");
    const r = await login(workerUrl, pw.trim(), rememberMe, rememberMe);
    setLoading(false);
    if (r.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/orders");
    } else {
      setError(r.error || "Hata");
      shake();
    }
  };

  const handleLogoTap = () => {
    const n = logoTaps + 1;
    setLogoTaps(n);
    clearTimeout(tapTimer.current);
    if (n >= 4) {
      setLogoTaps(0);
      setAdminModal(true);
      setAdminUnlocked(false);
      setAdminPw("");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      tapTimer.current = setTimeout(() => setLogoTaps(0), 1500);
    }
  };

  const loadAll = async () => {
    setAdminLoading(true);
    try {
      const [rc, rs, ro] = await Promise.all([
        fetch(`${workerUrl}/courier-list`),
        fetch(`${workerUrl}/admin-courier-stats`),
        fetch(`${workerUrl}/admin-orders`),
      ]);
      if (rc.ok) setCouriers(await rc.json());
      if (rs.ok) setCourierStats(await rs.json());
      if (ro.ok) setAdminOrders(await ro.json());
    } catch {}
    setAdminLoading(false);
  };

  const handleAdminUnlock = async () => {
    if (!adminPw.trim()) return;
    setAdminLoading(true);
    try {
      const r = await fetch(`${workerUrl}/admin-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPw }),
      });
      const d = await r.json();
      if (d.ok) {
        setAdminUnlocked(true);
        setEditAppName(appName);
        setEditWorkerUrl(workerUrl);
        await loadAll();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("", "Şifre yanlış");
      }
    } catch {
      Alert.alert("", "Bağlantı hatası");
    }
    setAdminLoading(false);
  };

  const handleAddCourier = async () => {
    if (!newName.trim() || !newCPw.trim()) {
      Alert.alert("", "İsim ve şifre zorunlu");
      return;
    }
    if (paymentType === "per_order" && !perOrderAmount.trim()) {
      Alert.alert("", "Sipariş başı ücret girin");
      return;
    }
    if (paymentType === "salary" && !salaryAmount.trim()) {
      Alert.alert("", "Maaş tutarı girin");
      return;
    }
    setAddingC(true);
    try {
      await fetch(`${workerUrl}/admin-couriers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          courier: {
            name: newName.trim(),
            phone: newPhone.trim(),
            password: newCPw.trim(),
            paymentType,
            perOrderAmount: parseFloat(perOrderAmount || "0"),
            salaryAmount: parseFloat(salaryAmount || "0"),
          },
        }),
      });
      setNewName("");
      setNewPhone("");
      setNewCPw("");
      setPerOrderAmount("");
      setSalaryAmount("");
      setPaymentType("per_order");
      await loadAll();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    setAddingC(false);
  };

  const handleDeleteCourier = (id: string, name: string) => {
    Alert.alert(`"${name}" silinsin mi?`, "", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await fetch(`${workerUrl}/admin-couriers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", courierId: id }),
          });
          await loadAll();
        },
      },
    ]);
  };

  const handleEditCourier = (cs: any) => {
    if (editingCourier?.id === cs.id) {
      setEditingCourier(null);
      return;
    }
    setEditingCourier(cs);
    setEditName(cs.name || "");
    setEditPhone(cs.phone || "");
    setEditPw("");
    setEditPayType(cs.paymentType || "per_order");
    setEditPerAmt(String(cs.perOrderAmount || ""));
    setEditSalAmt(String(cs.salaryAmount || ""));
    setEditGender(cs.gender || "male");
  };

  const handleUpdateCourier = async () => {
    if (!editingCourier || !editName.trim()) {
      Alert.alert("", "İsim boş olamaz");
      return;
    }
    setSavingEdit(true);
    try {
      const body: any = {
        action: "update",
        courierId: editingCourier.id,
        name: editName.trim(),
        phone: editPhone.trim(),
        paymentType: editPayType,
        perOrderAmount: parseFloat(editPerAmt || "0"),
        salaryAmount: parseFloat(editSalAmt || "0"),
        gender: editGender,
      };
      if (editPw.trim()) body.password = editPw.trim();
      const res = await fetch(`${workerUrl}/admin-couriers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEditingCourier(null);
        await loadAll();
      } else Alert.alert("Hata", d.error || "Güncelleme başarısız");
    } catch {
      Alert.alert("", "Bağlantı hatası");
    }
    setSavingEdit(false);
  };

  const handleResetCourierStats = (courierId: string, courierName: string) => {
    Alert.alert(
      "🗑 İstatistiği Sıfırla",
      `${courierName} için TÜM istatistikler sıfırlanacak. GERİ ALINAMAZ!`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sıfırla",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(
                `${workerUrl}/admin-reset-courier-stats`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ courierId }),
                },
              );
              const d = await res.json();
              if (d.ok) {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                await loadAll();
              } else Alert.alert("Hata", "Sıfırlama başarısız.");
            } catch {
              Alert.alert("", "Bağlantı hatası");
            }
          },
        },
      ],
    );
  };

  const handleToggleCourier = async (id: string, active: boolean) => {
    await fetch(`${workerUrl}/admin-couriers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle",
        courierId: id,
        active: !active,
      }),
    });
    await loadAll();
  };

  const handleKasaAction = (
    courierId: string,
    courierName: string,
    action: "accept" | "partial" | "reject",
    netKasa: number,
  ) => {
    const titles = {
      accept: "✅ Teslim Alındı",
      partial: "⚠️ Kısmi Teslim",
      reject: "❌ Eksik/Alınmadı",
    };
    const msgs = {
      accept: `${courierName} - ${netKasa.toFixed(0)}₴ kasa teslim alınacak ve kasa sıfırlanacak. Onayla?`,
      partial: `${courierName} - kısmen teslim. Kasa sıfırlanacak. Onayla?`,
      reject: `${courierName} - teslim YOK. Kasa sıfırlanmayacak, kayıt tutulacak.`,
    };
    Alert.alert(titles[action], msgs[action], [
      { text: "İptal", style: "cancel" },
      {
        text:
          action === "accept"
            ? "✅ Onayla ve Sıfırla"
            : action === "partial"
              ? "⚠️ Onayla"
              : "❌ Kaydet",
        style: action === "reject" ? "destructive" : "default",
        onPress: async () => {
          try {
            const res = await fetch(`${workerUrl}/admin-kasa-action`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courierId, action, note: "", netKasa }),
            });
            const d = await res.json();
            if (d.ok) {
              Haptics.notificationAsync(
                action === "accept"
                  ? Haptics.NotificationFeedbackType.Success
                  : Haptics.NotificationFeedbackType.Warning,
              );
              Alert.alert(
                action === "accept" ? "✅ Teslim Alındı" : "Kaydedildi",
                action === "accept"
                  ? `${courierName} kasası sıfırlandı.`
                  : "İşlem kaydedildi.",
              );
              await loadAll();
            } else {
              Alert.alert("Hata", "İşlem başarısız oldu. Tekrar dene.");
            }
          } catch (e) {
            Alert.alert(
              "Bağlantı Hatası",
              "Worker'a ulaşılamadı. Worker URL'yi kontrol et.",
            );
          }
        },
      },
    ]);
  };

  const handleDeleteOrder = (orderId: string) => {
    Alert.alert("Sipariş silinsin mi?", orderId, [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await fetch(`${workerUrl}/admin-orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete", orderId }),
          });
          await loadAll();
        },
      },
    ]);
  };

  const handleDeleteAllOrders = () => {
    Alert.alert("TÜM SİPARİŞLER SİLİNSİN Mİ?", "Bu işlem geri alınamaz!", [
      { text: "İptal", style: "cancel" },
      {
        text: "Tümünü Sil",
        style: "destructive",
        onPress: async () => {
          await fetch(`${workerUrl}/admin-orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "deleteAll" }),
          });
          await loadAll();
        },
      },
    ]);
  };

  const handleSaveSettings = async ({
    appNameVal,
    workerUrlVal,
  }: {
    appNameVal?: string;
    workerUrlVal?: string;
  }) => {
    setSavingSettings(true);
    try {
      const baseUrl = (workerUrlVal || workerUrl).trim().replace(/\/$/, "");
      // 1. Uygulama adını context + AsyncStorage'a kaydet (anında güncellenir)
      if (appNameVal && appNameVal.trim() !== appName) {
        await setAppName(appNameVal.trim());
        setEditAppName(appNameVal.trim());
      }
      // 2. Worker URL değiştiyse kaydet
      if (workerUrlVal && workerUrlVal.trim() !== workerUrl) {
        await setWorkerUrl(workerUrlVal.trim());
        setEditWorkerUrl(workerUrlVal.trim());
      }
      // 3. Worker'a da kaydet (su uygulaması ile senkron)
      try {
        const r = await fetch(`${baseUrl}/get-data`);
        if (r.ok) {
          const data = await r.json();
          const newSettings = {
            ...data?.settings,
            appName: appNameVal ?? appName,
          };
          await fetch(`${baseUrl}/save-settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newSettings),
          });
        }
      } catch {}
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "✅",
        language === "tr"
          ? "Kaydedildi!"
          : language === "uk"
            ? "Збережено!"
            : "Saved!",
      );
    } catch {
      Alert.alert("", language === "tr" ? "Hata oluştu" : "Error");
    }
    setSavingSettings(false);
  };

  const filteredOrders =
    orderFilter === "all"
      ? adminOrders
      : adminOrders.filter((o) => o.status === orderFilter);

  const statusColor = (s: string) =>
    s === "delivered"
      ? GREEN
      : s === "cancelled"
        ? RED
        : s === "on_the_way"
          ? BLUE
          : AMBER;
  const statusLabel = (s: string) =>
    s === "delivered"
      ? "✅ TESLİM"
      : s === "cancelled"
        ? "❌ İPTAL"
        : s === "on_the_way"
          ? "🚴 YOLDA"
          : s === "accepted"
            ? "📦 ALINDI"
            : "⏳ BEKLİYOR";

  if (!isLoaded)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={BLUE} size="large" />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={20}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Dil */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginBottom: 32,
            gap: 8,
          }}
        >
          {LANGS.map((l) => (
            <Pressable
              key={l}
              onPress={() => {
                setLanguage(l);
                Haptics.selectionAsync();
              }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: l === language ? BLUE + "22" : "transparent",
                borderWidth: l === language ? 2 : 1,
                borderColor: l === language ? BLUE : BDR,
              }}
            >
              <Text style={{ fontSize: 20 }}>{FLAGS[l]}</Text>
            </Pressable>
          ))}
        </View>

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Pressable
            onPress={handleLogoTap}
            style={{
              width: 120,
              height: 120,
              borderRadius: 36,
              backgroundColor: BLUE,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              shadowColor: BLUE,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 12,
              borderWidth: logoTaps > 0 ? 3 : 0,
              borderColor: "#fff",
            }}
          >
            <Text style={{ fontSize: 60 }}>🚚</Text>
          </Pressable>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: TXT,
              letterSpacing: -0.5,
              textAlign: "center",
            }}
          >
            {appName}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: TXT2,
              marginTop: 6,
              textAlign: "center",
            }}
          >
            {Lc.sub}
          </Text>
        </View>

        {/* Form */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <View
            style={{
              backgroundColor: CARD,
              borderRadius: 24,
              padding: 22,
              gap: 14,
              borderWidth: 1,
              borderColor: BDR,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: dark ? 0.3 : 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: TXT3,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 8,
                }}
              >
                {Lc.pw}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: INP,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: error ? RED : BDR,
                  paddingHorizontal: 16,
                }}
              >
                <Ionicons
                  name="lock-closed"
                  size={18}
                  color={error ? RED : BLUE}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  value={pw}
                  onChangeText={(v) => {
                    setPw(v);
                    setError("");
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={TXT3}
                  secureTextEntry={!showPw}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={{
                    flex: 1,
                    fontSize: 20,
                    color: TXT,
                    paddingVertical: 16,
                    letterSpacing: showPw ? 0 : 6,
                  }}
                />
                <Pressable onPress={() => setShowPw((p) => !p)} hitSlop={14}>
                  <Ionicons
                    name={showPw ? "eye-off" : "eye"}
                    size={20}
                    color={TXT3}
                  />
                </Pressable>
              </View>
            </View>
            {!!error && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="alert-circle" size={15} color={RED} />
                <Text style={{ fontSize: 13, color: RED }}>{error}</Text>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: INP,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: TXT }}>
                  {Lc.remember}
                </Text>
                <Text style={{ fontSize: 11, color: TXT3 }}>{Lc.auto}</Text>
              </View>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                trackColor={{ false: BDR, true: BLUE }}
                thumbColor="#fff"
              />
            </View>
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#0860A8" : BLUE,
                borderRadius: 18,
                paddingVertical: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                shadowColor: BLUE,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45,
                shadowRadius: 14,
                elevation: 10,
                opacity: loading ? 0.85 : 1,
              })}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text
                    style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}
                  >
                    {Lc.connect}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="log-in" size={22} color="#fff" />
                  <Text
                    style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}
                  >
                    {Lc.btn}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
        <Text
          style={{
            fontSize: 11,
            color: TXT3,
            textAlign: "center",
            marginTop: 28,
          }}
        >
          INVER Courier v1.0
        </Text>
      </ScrollView>

      {/* ═══ GİZLİ ADMİN MODAL ═══ */}
      <Modal
        visible={adminModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setAdminModal(false);
          setAdminUnlocked(false);
        }}
      >
        <View
          style={{ flex: 1, backgroundColor: dark ? "#070F1C" : "#F0F8FF" }}
        >
          {/* Header */}
          <View
            style={{
              paddingTop: insets.top + 14,
              paddingBottom: 14,
              paddingHorizontal: 20,
              backgroundColor: "#0A1929",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>
                ⚙️ Kurye Admin
              </Text>
              {adminUnlocked && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 2,
                  }}
                >
                  {workerUrl.replace("https://", "").slice(0, 35)}
                </Text>
              )}
            </View>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              {adminUnlocked && adminLoading && (
                <ActivityIndicator color="#fff" size="small" />
              )}
              {adminUnlocked && !adminLoading && (
                <Pressable onPress={loadAll} hitSlop={10}>
                  <Ionicons
                    name="refresh"
                    size={22}
                    color="rgba(255,255,255,0.7)"
                  />
                </Pressable>
              )}
              <Pressable
                onPress={() => {
                  setAdminModal(false);
                  setAdminUnlocked(false);
                  setAdminPw("");
                }}
                hitSlop={14}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color="rgba(255,255,255,0.6)"
                />
              </Pressable>
            </View>
          </View>

          {!adminUnlocked ? (
            /* Şifre ekranı */
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                padding: 28,
                gap: 16,
              }}
            >
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: BLUE + "18",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="shield-checkmark" size={36} color={BLUE} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: TXT }}>
                  Admin Girişi
                </Text>
                <Text style={{ fontSize: 13, color: TXT3, marginTop: 4 }}>
                  Su uygulaması admin şifresi
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: INP,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: BDR,
                  paddingHorizontal: 16,
                }}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={TXT3}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  value={adminPw}
                  onChangeText={setAdminPw}
                  placeholder="Admin şifresi"
                  placeholderTextColor={TXT3}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleAdminUnlock}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: TXT,
                    paddingVertical: 16,
                  }}
                  autoFocus
                />
              </View>
              <Pressable
                onPress={handleAdminUnlock}
                disabled={adminLoading}
                style={{
                  backgroundColor: BLUE,
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {adminLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="log-in" size={20} color="#fff" />
                )}
                <Text
                  style={{ fontSize: 16, fontWeight: "900", color: "#fff" }}
                >
                  Giriş
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Tab bar */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: dark ? "#0A1929" : "#fff",
                  borderBottomWidth: 1,
                  borderBottomColor: BDR,
                }}
              >
                {(
                  [
                    {
                      k: "couriers" as AdminTab,
                      icon: "bicycle",
                      label: "Kuryeler",
                    },
                    {
                      k: "orders" as AdminTab,
                      icon: "receipt",
                      label: "Siparişler",
                    },
                    {
                      k: "stats" as AdminTab,
                      icon: "bar-chart",
                      label: "İstatistik",
                    },
                    {
                      k: "settings" as AdminTab,
                      icon: "settings",
                      label: "Ayarlar",
                    },
                  ] as const
                ).map((tab) => (
                  <Pressable
                    key={tab.k}
                    onPress={() => setAdminTab(tab.k)}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      alignItems: "center",
                      gap: 3,
                      borderBottomWidth: 2.5,
                      borderBottomColor:
                        adminTab === tab.k ? BLUE : "transparent",
                    }}
                  >
                    <Ionicons
                      name={tab.icon as any}
                      size={18}
                      color={adminTab === tab.k ? BLUE : TXT3}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: adminTab === tab.k ? BLUE : TXT3,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* ── KURYELER TAB ── */}
              {adminTab === "couriers" && (
                <ScrollView
                  contentContainerStyle={{
                    padding: 14,
                    paddingBottom: insets.bottom + 20,
                  }}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Kurye istatistik kartları */}
                  {courierStats.map((cs: any) => (
                    <View
                      key={cs.id}
                      style={{
                        backgroundColor: CARD,
                        borderRadius: 18,
                        padding: 16,
                        marginBottom: 10,
                        borderWidth: 1,
                        borderColor: cs.active ? GREEN + "30" : BDR,
                      }}
                    >
                      {/* Üst satır: avatar + isim + toggle + sil */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: cs.active
                              ? GREEN + "18"
                              : RED + "12",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: cs.active ? GREEN + "40" : RED + "25",
                          }}
                        >
                          <Text style={{ fontSize: 26 }}>
                            {cs.gender === "female" ? "👩" : "👨"}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "800",
                              color: TXT,
                            }}
                          >
                            {cs.name}
                          </Text>
                          {!!cs.phone && (
                            <Text style={{ fontSize: 12, color: TXT3 }}>
                              {cs.phone}
                            </Text>
                          )}
                          {/* Ödeme tipi badge */}
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 6,
                              marginTop: 4,
                            }}
                          >
                            <View
                              style={{
                                backgroundColor:
                                  cs.paymentType === "salary"
                                    ? PURP + "20"
                                    : AMBER + "20",
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderWidth: 1,
                                borderColor:
                                  cs.paymentType === "salary"
                                    ? PURP + "40"
                                    : AMBER + "40",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "700",
                                  color:
                                    cs.paymentType === "salary" ? PURP : AMBER,
                                }}
                              >
                                {cs.paymentType === "salary"
                                  ? `💼 Maaş: ${cs.salaryAmount}₴`
                                  : `📦 Sipariş başı: ${cs.perOrderAmount}₴`}
                              </Text>
                            </View>
                            <View
                              style={{
                                backgroundColor: cs.active
                                  ? GREEN + "15"
                                  : RED + "15",
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderWidth: 1,
                                borderColor: cs.active
                                  ? GREEN + "30"
                                  : RED + "30",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "700",
                                  color: cs.active ? GREEN : RED,
                                }}
                              >
                                {cs.active ? "● Aktif" : "○ Pasif"}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 8 }}>
                          <Switch
                            value={cs.active}
                            onValueChange={() =>
                              handleToggleCourier(cs.id, cs.active)
                            }
                            trackColor={{ false: "#767577", true: GREEN }}
                            thumbColor="#fff"
                          />
                          <View style={{ flexDirection: "row", gap: 12 }}>
                            <Pressable
                              onPress={() => handleEditCourier(cs)}
                              hitSlop={12}
                            >
                              <Ionicons
                                name={
                                  editingCourier?.id === cs.id
                                    ? "close-circle-outline"
                                    : "create-outline"
                                }
                                size={20}
                                color={
                                  editingCourier?.id === cs.id ? RED : BLUE
                                }
                              />
                            </Pressable>
                            <Pressable
                              onPress={() =>
                                handleDeleteCourier(cs.id, cs.name)
                              }
                              hitSlop={12}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color={RED}
                              />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                      {/* İstatistik satırı */}
                      {/* Haftalık istatistikler */}
                      {(() => {
                        const weeklyO = cs.weeklyOrders || cs.totalOrders || 0;
                        const weeklyL = cs.weeklyLiters || cs.totalLiters || 0;
                        // Toplam kurye kazancı: tüm zamanlar (sıfırlanmaz)
                        const totalEarnings =
                          cs.paymentType !== "salary"
                            ? (cs.totalOrders || 0) * (cs.perOrderAmount || 0)
                            : cs.salaryAmount || 0;
                        return (
                          <View style={{ gap: 6, marginBottom: 8 }}>
                            {/* Satır 1: Teslimat + Litre + Kasa */}
                            <View style={{ flexDirection: "row", gap: 6 }}>
                              {[
                                {
                                  icon: "📦",
                                  label: "7 Gün Teslimat",
                                  val: String(weeklyO),
                                  color: BLUE,
                                },
                                {
                                  icon: "💧",
                                  label: "7 Gün Litre",
                                  val: weeklyL + "L",
                                  color: "#0891B2",
                                },
                                {
                                  icon: "🏦",
                                  label: "Toplam Kasa",
                                  val:
                                    (cs.totalKasaAllTime || 0).toFixed(0) + "₴",
                                  color: GREEN,
                                },
                              ].map((item, i) => (
                                <View
                                  key={i}
                                  style={{
                                    flex: 1,
                                    backgroundColor: item.color + "10",
                                    borderRadius: 10,
                                    padding: 8,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: item.color + "20",
                                  }}
                                >
                                  <Text style={{ fontSize: 13 }}>
                                    {item.icon}
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      fontWeight: "900",
                                      color: item.color,
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.val}
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 8,
                                      color: TXT3,
                                      marginTop: 1,
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.label}
                                  </Text>
                                </View>
                              ))}
                            </View>
                            {/* Satır 2: Bekleyen kasa + Kurye toplam kazancı */}
                            <View style={{ flexDirection: "row", gap: 6 }}>
                              <View
                                style={{
                                  flex: 1,
                                  backgroundColor:
                                    (cs.pendingKasa || 0) > 0
                                      ? AMBER + "10"
                                      : GREEN + "08",
                                  borderRadius: 10,
                                  padding: 8,
                                  alignItems: "center",
                                  borderWidth: 1,
                                  borderColor:
                                    (cs.pendingKasa || 0) > 0
                                      ? AMBER + "30"
                                      : GREEN + "20",
                                }}
                              >
                                <Text style={{ fontSize: 13 }}>💰</Text>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: "900",
                                    color:
                                      (cs.pendingKasa || 0) > 0 ? AMBER : GREEN,
                                    marginTop: 2,
                                  }}
                                >
                                  {(cs.netKasa || 0).toFixed(0)}₴
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 8,
                                    color: TXT3,
                                    marginTop: 1,
                                  }}
                                >
                                  Bekleyen Net Kasa
                                </Text>
                              </View>
                              {cs.paymentType !== "salary" && (
                                <View
                                  style={{
                                    flex: 1,
                                    backgroundColor: PURP + "10",
                                    borderRadius: 10,
                                    padding: 8,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: PURP + "20",
                                  }}
                                >
                                  <Text style={{ fontSize: 13 }}>💵</Text>
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      fontWeight: "900",
                                      color: PURP,
                                      marginTop: 2,
                                    }}
                                  >
                                    {totalEarnings.toFixed(0)}₴
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 8,
                                      color: TXT3,
                                      marginTop: 1,
                                      textAlign: "center",
                                    }}
                                  >
                                    {cs.totalOrders || 0}×
                                    {cs.perOrderAmount || 0}₴ toplam
                                  </Text>
                                </View>
                              )}
                              {cs.paymentType === "salary" && (
                                <View
                                  style={{
                                    flex: 1,
                                    backgroundColor: PURP + "10",
                                    borderRadius: 10,
                                    padding: 8,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: PURP + "20",
                                  }}
                                >
                                  <Text style={{ fontSize: 13 }}>💼</Text>
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      fontWeight: "900",
                                      color: PURP,
                                      marginTop: 2,
                                    }}
                                  >
                                    {cs.salaryAmount || 0}₴
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 8,
                                      color: TXT3,
                                      marginTop: 1,
                                    }}
                                  >
                                    Aylık Maaş
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })()}

                      {/* Kasa yönetimi — paket başı kuryeler için */}
                      {(cs.pendingKasa || 0) > 0 && (
                        <View
                          style={{
                            backgroundColor: cs.kasaTeslimTalep
                              ? AMBER + "15"
                              : GREEN + "08",
                            borderRadius: 12,
                            padding: 10,
                            borderWidth: 1.5,
                            borderColor: cs.kasaTeslimTalep
                              ? AMBER + "50"
                              : GREEN + "20",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 6,
                            }}
                          >
                            <Text style={{ fontSize: 16 }}>
                              {cs.kasaTeslimTalep ? "🔔" : "💰"}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "800",
                                color: cs.kasaTeslimTalep ? AMBER : TXT2,
                                flex: 1,
                              }}
                            >
                              {cs.kasaTeslimTalep
                                ? "Kasa Teslim Talebi Var!"
                                : "Bekleyen Kasa"}
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 6,
                              marginBottom: cs.kasaTeslimTalep ? 8 : 0,
                            }}
                          >
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: dark
                                  ? "rgba(255,255,255,0.05)"
                                  : "#F8FFFE",
                                borderRadius: 8,
                                padding: 8,
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 9, color: TXT3 }}>
                                🏦 Net Kasa
                              </Text>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: "900",
                                  color: GREEN,
                                }}
                              >
                                {(cs.netKasa || 0).toFixed(0)}₴
                              </Text>
                            </View>
                            <View
                              style={{
                                flex: 1,
                                backgroundColor: dark
                                  ? "rgba(255,255,255,0.05)"
                                  : "#F8FFFE",
                                borderRadius: 8,
                                padding: 8,
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ fontSize: 9, color: TXT3 }}>
                                💵 Kurye Payı
                              </Text>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: "900",
                                  color: PURP,
                                }}
                              >
                                -{(cs.courierEarnings || 0).toFixed(0)}₴
                              </Text>
                            </View>
                          </View>
                          {cs.kasaTeslimTalep && (
                            <View style={{ flexDirection: "row", gap: 6 }}>
                              <Pressable
                                onPress={() =>
                                  handleKasaAction(
                                    cs.id,
                                    cs.name,
                                    "reject",
                                    cs.netKasa || 0,
                                  )
                                }
                                style={{
                                  flex: 1,
                                  backgroundColor: RED + "15",
                                  borderRadius: 10,
                                  paddingVertical: 10,
                                  alignItems: "center",
                                  borderWidth: 1,
                                  borderColor: RED + "30",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: "800",
                                    color: RED,
                                  }}
                                >
                                  ❌ Eksik
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() =>
                                  handleKasaAction(
                                    cs.id,
                                    cs.name,
                                    "partial",
                                    cs.netKasa || 0,
                                  )
                                }
                                style={{
                                  flex: 1,
                                  backgroundColor: AMBER + "15",
                                  borderRadius: 10,
                                  paddingVertical: 10,
                                  alignItems: "center",
                                  borderWidth: 1,
                                  borderColor: AMBER + "30",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: "800",
                                    color: AMBER,
                                  }}
                                >
                                  ⚠️ Kısmi
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() =>
                                  handleKasaAction(
                                    cs.id,
                                    cs.name,
                                    "accept",
                                    cs.netKasa || 0,
                                  )
                                }
                                style={{
                                  flex: 2,
                                  backgroundColor: GREEN,
                                  borderRadius: 10,
                                  paddingVertical: 10,
                                  alignItems: "center",
                                  shadowColor: GREEN,
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: 0.4,
                                  shadowRadius: 8,
                                  elevation: 6,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: "900",
                                    color: "#fff",
                                  }}
                                >
                                  ✅ Teslim Alındı
                                </Text>
                              </Pressable>
                            </View>
                          )}
                        </View>
                      )}
                      {/* INLINE DÜZENLEME */}
                      {editingCourier?.id === cs.id && (
                        <View
                          style={{
                            marginTop: 12,
                            backgroundColor: dark
                              ? "rgba(10,126,200,0.1)"
                              : "#EFF8FF",
                            borderRadius: 16,
                            padding: 14,
                            borderWidth: 1.5,
                            borderColor: BLUE + "40",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "900",
                              color: BLUE,
                              marginBottom: 12,
                            }}
                          >
                            ✏️ Kurye Düzenle
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 8,
                              marginBottom: 12,
                            }}
                          >
                            {(
                              [
                                {
                                  val: "male" as const,
                                  icon: "👨",
                                  label: "Erkek",
                                },
                                {
                                  val: "female" as const,
                                  icon: "👩",
                                  label: "Bayan",
                                },
                              ] as const
                            ).map((opt) => (
                              <Pressable
                                key={opt.val}
                                onPress={() => setEditGender(opt.val)}
                                style={{
                                  flex: 1,
                                  paddingVertical: 10,
                                  borderRadius: 12,
                                  alignItems: "center",
                                  gap: 2,
                                  borderWidth: 2,
                                  backgroundColor:
                                    editGender === opt.val
                                      ? BLUE + "15"
                                      : "transparent",
                                  borderColor:
                                    editGender === opt.val ? BLUE : BDR,
                                }}
                              >
                                <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "700",
                                    color: editGender === opt.val ? BLUE : TXT3,
                                  }}
                                >
                                  {opt.label}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                          <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="İsim *"
                            placeholderTextColor={TXT3}
                            style={{
                              backgroundColor: CARD,
                              borderRadius: 11,
                              padding: 12,
                              fontSize: 14,
                              color: TXT,
                              borderWidth: 1.5,
                              borderColor: BDR,
                              marginBottom: 8,
                            }}
                          />
                          <TextInput
                            value={editPhone}
                            onChangeText={setEditPhone}
                            placeholder="Telefon"
                            placeholderTextColor={TXT3}
                            keyboardType="phone-pad"
                            style={{
                              backgroundColor: CARD,
                              borderRadius: 11,
                              padding: 12,
                              fontSize: 14,
                              color: TXT,
                              borderWidth: 1.5,
                              borderColor: BDR,
                              marginBottom: 8,
                            }}
                          />
                          <TextInput
                            value={editPw}
                            onChangeText={setEditPw}
                            placeholder="Yeni Şifre (boş=değişmez)"
                            placeholderTextColor={TXT3}
                            secureTextEntry
                            style={{
                              backgroundColor: CARD,
                              borderRadius: 11,
                              padding: 12,
                              fontSize: 14,
                              color: TXT,
                              borderWidth: 1.5,
                              borderColor: BDR,
                              marginBottom: 12,
                            }}
                          />
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 8,
                              marginBottom: 10,
                            }}
                          >
                            {(
                              [
                                {
                                  val: "per_order" as const,
                                  label: "📦 Sipariş Başı",
                                  color: AMBER,
                                },
                                {
                                  val: "salary" as const,
                                  label: "💼 Maaşlı",
                                  color: PURP,
                                },
                              ] as const
                            ).map((opt) => (
                              <Pressable
                                key={opt.val}
                                onPress={() => setEditPayType(opt.val)}
                                style={{
                                  flex: 1,
                                  paddingVertical: 10,
                                  borderRadius: 11,
                                  alignItems: "center",
                                  borderWidth: 2,
                                  backgroundColor:
                                    editPayType === opt.val
                                      ? opt.color + "18"
                                      : "transparent",
                                  borderColor:
                                    editPayType === opt.val ? opt.color : BDR,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    fontWeight: "700",
                                    color:
                                      editPayType === opt.val
                                        ? opt.color
                                        : TXT3,
                                  }}
                                >
                                  {opt.label}
                                </Text>
                              </Pressable>
                            ))}
                          </View>
                          {editPayType === "per_order" ? (
                            <TextInput
                              value={editPerAmt}
                              onChangeText={setEditPerAmt}
                              placeholder="Sipariş başı ₴"
                              placeholderTextColor={TXT3}
                              keyboardType="numeric"
                              style={{
                                backgroundColor: CARD,
                                borderRadius: 11,
                                padding: 12,
                                fontSize: 18,
                                fontWeight: "800",
                                color: AMBER,
                                borderWidth: 2,
                                borderColor: AMBER + "50",
                                marginBottom: 12,
                                textAlign: "center",
                              }}
                            />
                          ) : (
                            <TextInput
                              value={editSalAmt}
                              onChangeText={setEditSalAmt}
                              placeholder="Aylık maaş ₴"
                              placeholderTextColor={TXT3}
                              keyboardType="numeric"
                              style={{
                                backgroundColor: CARD,
                                borderRadius: 11,
                                padding: 12,
                                fontSize: 18,
                                fontWeight: "800",
                                color: PURP,
                                borderWidth: 2,
                                borderColor: PURP + "50",
                                marginBottom: 12,
                                textAlign: "center",
                              }}
                            />
                          )}
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable
                              onPress={() => setEditingCourier(null)}
                              style={{
                                flex: 1,
                                paddingVertical: 13,
                                borderRadius: 14,
                                alignItems: "center",
                                borderWidth: 1.5,
                                borderColor: BDR,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "700",
                                  color: TXT3,
                                }}
                              >
                                İptal
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={handleUpdateCourier}
                              disabled={savingEdit}
                              style={{
                                flex: 2,
                                paddingVertical: 13,
                                borderRadius: 14,
                                alignItems: "center",
                                flexDirection: "row",
                                justifyContent: "center",
                                gap: 8,
                                backgroundColor: BLUE,
                                opacity: savingEdit ? 0.7 : 1,
                              }}
                            >
                              {savingEdit ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <>
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={18}
                                    color="#fff"
                                  />
                                  <Text
                                    style={{
                                      fontSize: 15,
                                      fontWeight: "900",
                                      color: "#fff",
                                    }}
                                  >
                                    Kaydet
                                  </Text>
                                </>
                              )}
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}

                  {/* Yeni kurye ekle */}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: TXT3,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 10,
                      marginTop: 6,
                    }}
                  >
                    Yeni Kurye Ekle
                  </Text>
                  <View
                    style={{
                      backgroundColor: CARD,
                      borderRadius: 16,
                      padding: 16,
                      gap: 10,
                      borderWidth: 1,
                      borderColor: BDR,
                    }}
                  >
                    {[
                      {
                        ph: "İsim *",
                        val: newName,
                        set: setNewName,
                        sec: false,
                        kb: "default" as const,
                      },
                      {
                        ph: "Telefon",
                        val: newPhone,
                        set: setNewPhone,
                        sec: false,
                        kb: "phone-pad" as const,
                      },
                      {
                        ph: "Şifre *",
                        val: newCPw,
                        set: setNewCPw,
                        sec: true,
                        kb: "default" as const,
                      },
                    ].map((f, i) => (
                      <TextInput
                        key={i}
                        value={f.val}
                        onChangeText={f.set}
                        placeholder={f.ph}
                        placeholderTextColor={TXT3}
                        secureTextEntry={f.sec}
                        keyboardType={f.kb}
                        style={{
                          backgroundColor: INP,
                          borderRadius: 12,
                          padding: 13,
                          fontSize: 14,
                          color: TXT,
                          borderWidth: 1,
                          borderColor: BDR,
                        }}
                      />
                    ))}

                    {/* Ödeme tipi seçimi */}
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: TXT3,
                        textTransform: "uppercase",
                        letterSpacing: 0.6,
                      }}
                    >
                      Ödeme Sistemi
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {(
                        [
                          {
                            val: "per_order" as const,
                            label: "📦 Sipariş Başı",
                            color: AMBER,
                          },
                          {
                            val: "salary" as const,
                            label: "💼 Maaşlı",
                            color: PURP,
                          },
                        ] as const
                      ).map((opt) => (
                        <Pressable
                          key={opt.val}
                          onPress={() => setPaymentType(opt.val)}
                          style={{
                            flex: 1,
                            paddingVertical: 11,
                            borderRadius: 12,
                            alignItems: "center",
                            borderWidth: 2,
                            backgroundColor:
                              paymentType === opt.val
                                ? opt.color + "18"
                                : "transparent",
                            borderColor:
                              paymentType === opt.val ? opt.color : BDR,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: paymentType === opt.val ? opt.color : TXT3,
                            }}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Tutar */}
                    {paymentType === "per_order" && (
                      <TextInput
                        value={perOrderAmount}
                        onChangeText={setPerOrderAmount}
                        placeholder="Sipariş başı ₴ (örn: 50)"
                        placeholderTextColor={TXT3}
                        keyboardType="numeric"
                        style={{
                          backgroundColor: INP,
                          borderRadius: 12,
                          padding: 13,
                          fontSize: 14,
                          color: TXT,
                          borderWidth: 1.5,
                          borderColor: AMBER + "50",
                        }}
                      />
                    )}
                    {paymentType === "salary" && (
                      <TextInput
                        value={salaryAmount}
                        onChangeText={setSalaryAmount}
                        placeholder="Aylık maaş ₴ (örn: 15000)"
                        placeholderTextColor={TXT3}
                        keyboardType="numeric"
                        style={{
                          backgroundColor: INP,
                          borderRadius: 12,
                          padding: 13,
                          fontSize: 14,
                          color: TXT,
                          borderWidth: 1.5,
                          borderColor: PURP + "50",
                        }}
                      />
                    )}

                    <Pressable
                      onPress={handleAddCourier}
                      disabled={addingC}
                      style={{
                        backgroundColor: GREEN,
                        borderRadius: 14,
                        paddingVertical: 14,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {addingC ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons name="add-circle" size={18} color="#fff" />
                      )}
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "900",
                          color: "#fff",
                        }}
                      >
                        Ekle (Pasif olarak)
                      </Text>
                    </Pressable>
                    <Text
                      style={{ fontSize: 11, color: TXT3, textAlign: "center" }}
                    >
                      ⚠️ Yeni kurye varsayılan olarak pasif eklenir.
                      Aktifleştirmek için toggle'a basın.
                    </Text>
                  </View>
                </ScrollView>
              )}

              {/* ── SİPARİŞLER TAB ── */}
              {adminTab === "orders" && (
                <View style={{ flex: 1 }}>
                  {/* Filtre + sil tümü */}
                  <View
                    style={{
                      flexDirection: "row",
                      padding: 12,
                      gap: 6,
                      backgroundColor: dark ? "#0A1929" : "#fff",
                      flexWrap: "wrap",
                    }}
                  >
                    {(
                      ["all", "pending", "delivered", "cancelled"] as const
                    ).map((f) => (
                      <Pressable
                        key={f}
                        onPress={() => setOrderFilter(f)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                          backgroundColor:
                            orderFilter === f ? BLUE + "20" : INP,
                          borderWidth: 1.5,
                          borderColor: orderFilter === f ? BLUE : BDR,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: orderFilter === f ? BLUE : TXT3,
                          }}
                        >
                          {f === "all"
                            ? "Tümü"
                            : f === "pending"
                              ? "Bekliyor"
                              : f === "delivered"
                                ? "Teslim"
                                : "İptal"}{" "}
                          (
                          {f === "all"
                            ? adminOrders.length
                            : adminOrders.filter((o) => o.status === f).length}
                          )
                        </Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={handleDeleteAllOrders}
                      style={{
                        marginLeft: "auto",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        backgroundColor: RED + "15",
                        borderWidth: 1.5,
                        borderColor: RED + "30",
                      }}
                    >
                      <Text
                        style={{ fontSize: 11, fontWeight: "700", color: RED }}
                      >
                        🗑 Tümünü Sil
                      </Text>
                    </Pressable>
                  </View>

                  <ScrollView
                    contentContainerStyle={{
                      padding: 12,
                      paddingBottom: insets.bottom + 20,
                    }}
                  >
                    {filteredOrders.length === 0 ? (
                      <View style={{ alignItems: "center", paddingTop: 40 }}>
                        <Ionicons
                          name="receipt-outline"
                          size={44}
                          color={TXT3}
                        />
                        <Text style={{ color: TXT3, marginTop: 10 }}>
                          Sipariş yok
                        </Text>
                      </View>
                    ) : (
                      filteredOrders.map((o: any) => {
                        const sc = statusColor(o.status);
                        const dt = new Date(o.savedAt || o.date || Date.now());
                        return (
                          <View
                            key={o.orderId}
                            style={{
                              backgroundColor: CARD,
                              borderRadius: 16,
                              padding: 14,
                              marginBottom: 8,
                              borderWidth: 1,
                              borderColor: BDR,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 11,
                                  fontWeight: "800",
                                  color: BLUE,
                                }}
                              >
                                #{(o.orderId || "").slice(-8)}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: TXT3,
                                  marginRight: 8,
                                }}
                              >
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
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderWidth: 1,
                                  borderColor: sc + "35",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: "800",
                                    color: sc,
                                  }}
                                >
                                  {statusLabel(o.status)}
                                </Text>
                              </View>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 6,
                              }}
                            >
                              <Ionicons
                                name="person-outline"
                                size={13}
                                color={BLUE}
                                style={{ marginRight: 6 }}
                              />
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 13,
                                  fontWeight: "700",
                                  color: TXT,
                                }}
                              >
                                {o.name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: GREEN,
                                  fontWeight: "800",
                                }}
                              >
                                {(o.total || 0).toFixed(0)}₴
                              </Text>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 8,
                              }}
                            >
                              <Ionicons
                                name="location-outline"
                                size={13}
                                color={RED}
                                style={{ marginRight: 6 }}
                              />
                              <Text
                                style={{ flex: 1, fontSize: 12, color: TXT2 }}
                                numberOfLines={1}
                              >
                                {[o.city, o.street, o.building]
                                  .filter(Boolean)
                                  .join(", ")}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: BLUE,
                                  marginLeft: 6,
                                }}
                              >
                                💧{o.liters}L
                              </Text>
                            </View>
                            {!!o.courierName && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: TXT3,
                                  marginBottom: 6,
                                }}
                              >
                                🚴 {o.courierName}
                              </Text>
                            )}
                            <Pressable
                              onPress={() => handleDeleteOrder(o.orderId)}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                paddingVertical: 8,
                                backgroundColor: RED + "10",
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: RED + "25",
                              }}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={14}
                                color={RED}
                              />
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: RED,
                                  fontWeight: "700",
                                }}
                              >
                                Sil
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}

              {/* ── İSTATİSTİK TAB ── */}
              {adminTab === "stats" && (
                <ScrollView
                  contentContainerStyle={{
                    padding: 14,
                    paddingBottom: insets.bottom + 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: TXT3,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 12,
                    }}
                  >
                    Kurye Performans Raporu
                  </Text>

                  {/* Genel toplam — 4 kutu + 7 günlük */}
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: TXT3,
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    📅 Son 7 Gün
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      {
                        icon: "📦",
                        label: "7g Teslimat",
                        val: String(
                          courierStats.reduce(
                            (s, c) => s + (c.weeklyOrders || 0),
                            0,
                          ),
                        ),
                        color: BLUE,
                      },
                      {
                        icon: "💧",
                        label: "7g Litre",
                        val:
                          courierStats.reduce(
                            (s, c) => s + (c.weeklyLiters || 0),
                            0,
                          ) + "L",
                        color: "#0891B2",
                      },
                      {
                        icon: "🏦",
                        label: "7g Kasa",
                        val:
                          courierStats
                            .reduce((s, c) => s + (c.weeklyKasa || 0), 0)
                            .toFixed(0) + "₴",
                        color: GREEN,
                      },
                      {
                        icon: "💵",
                        label: "7g Kurye Kazancı",
                        val:
                          courierStats
                            .reduce(
                              (s, c) => s + (c.weeklyCourierEarnings || 0),
                              0,
                            )
                            .toFixed(0) + "₴",
                        color: PURP,
                      },
                    ].map((item, i) => (
                      <View
                        key={i}
                        style={{
                          width: "48%",
                          backgroundColor: item.color + "10",
                          borderRadius: 14,
                          padding: 10,
                          alignItems: "center",
                          borderWidth: 1.5,
                          borderColor: item.color + "25",
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "900",
                            color: item.color,
                            marginTop: 3,
                          }}
                        >
                          {item.val}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: TXT3,
                            marginTop: 1,
                            textAlign: "center",
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: TXT3,
                      textTransform: "uppercase",
                      marginBottom: 6,
                      marginTop: 4,
                    }}
                  >
                    📊 Tüm Zamanlar
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      marginBottom: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    {[
                      {
                        icon: "📦",
                        label: "Toplam Teslimat",
                        val: String(
                          courierStats.reduce(
                            (s, c) => s + (c.totalOrders || 0),
                            0,
                          ),
                        ),
                        color: BLUE,
                      },
                      {
                        icon: "💧",
                        label: "Toplam Litre",
                        val:
                          courierStats.reduce(
                            (s, c) => s + (c.totalLiters || 0),
                            0,
                          ) + "L",
                        color: "#0891B2",
                      },
                      {
                        icon: "🏦",
                        label: "Toplam Kasa",
                        val:
                          courierStats
                            .reduce((s, c) => s + (c.totalKasaAllTime || 0), 0)
                            .toFixed(0) + "₴",
                        color: GREEN,
                      },
                      {
                        icon: "✅",
                        label: "Teslim Edilen",
                        val:
                          courierStats
                            .reduce((s, c) => s + (c.totalTeslimEdilen || 0), 0)
                            .toFixed(0) + "₴",
                        color: AMBER,
                      },
                    ].map((item, i) => (
                      <View
                        key={i}
                        style={{
                          width: "48%",
                          backgroundColor: item.color + "10",
                          borderRadius: 14,
                          padding: 10,
                          alignItems: "center",
                          borderWidth: 1.5,
                          borderColor: item.color + "25",
                          marginBottom: 4,
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "900",
                            color: item.color,
                            marginTop: 3,
                          }}
                        >
                          {item.val}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: TXT3,
                            marginTop: 1,
                            textAlign: "center",
                          }}
                        >
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Her kurye performans kartı */}
                  {[...courierStats]
                    .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
                    .map((cs: any, idx: number) => {
                      const isTop = idx === 0 && courierStats.length > 1;
                      return (
                        <View
                          key={cs.id}
                          style={{
                            backgroundColor: CARD,
                            borderRadius: 18,
                            padding: 14,
                            marginBottom: 12,
                            borderWidth: isTop ? 2 : 1,
                            borderColor: isTop ? GREEN + "60" : BDR,
                          }}
                        >
                          {/* Başlık */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 10,
                            }}
                          >
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: cs.active
                                  ? GREEN + "18"
                                  : RED + "12",
                                alignItems: "center",
                                justifyContent: "center",
                                borderWidth: 2,
                                borderColor: cs.active
                                  ? GREEN + "40"
                                  : RED + "25",
                              }}
                            >
                              <Text style={{ fontSize: 22 }}>
                                {isTop ? "🏆" : "🚴"}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  fontWeight: "900",
                                  color: TXT,
                                }}
                              >
                                {cs.name}
                              </Text>
                              <Text style={{ fontSize: 11, color: TXT3 }}>
                                {cs.paymentType === "salary"
                                  ? `Maaş: ${cs.salaryAmount}₴`
                                  : `Sipariş başı: ${cs.perOrderAmount}₴`}
                              </Text>
                            </View>
                            {isTop && (
                              <View
                                style={{
                                  backgroundColor: GREEN + "20",
                                  borderRadius: 10,
                                  paddingHorizontal: 10,
                                  paddingVertical: 4,
                                  borderWidth: 1,
                                  borderColor: GREEN + "40",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "800",
                                    color: GREEN,
                                  }}
                                >
                                  En İyi
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Stats grid — 4 kutu */}
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 6,
                              marginBottom: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            {[
                              {
                                icon: "📦",
                                label: "Teslimat",
                                val: String(cs.totalOrders || 0),
                                color: BLUE,
                              },
                              {
                                icon: "💧",
                                label: "Litre",
                                val: (cs.totalLiters || 0) + "L",
                                color: "#0891B2",
                              },
                              {
                                icon: "🏦",
                                label: "Toplam Kasa",
                                val:
                                  (cs.totalKasaAllTime || 0).toFixed(0) + "₴",
                                color: GREEN,
                              },
                              {
                                icon: "✅",
                                label: "Teslim Edilen",
                                val:
                                  (cs.totalTeslimEdilen || 0).toFixed(0) + "₴",
                                color: AMBER,
                              },
                            ].map((item, i) => (
                              <View
                                key={i}
                                style={{
                                  width: "48%",
                                  backgroundColor: item.color + "0C",
                                  borderRadius: 10,
                                  padding: 8,
                                  alignItems: "center",
                                  borderWidth: 1,
                                  borderColor: item.color + "18",
                                  marginBottom: 4,
                                }}
                              >
                                <Text style={{ fontSize: 12 }}>
                                  {item.icon}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 13,
                                    fontWeight: "900",
                                    color: item.color,
                                    marginTop: 2,
                                  }}
                                >
                                  {item.val}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 8,
                                    color: TXT3,
                                    marginTop: 1,
                                  }}
                                >
                                  {item.label}
                                </Text>
                              </View>
                            ))}
                          </View>

                          {/* Paket başı kurye ise toplam kazanç göster */}
                          {cs.paymentType !== "salary" &&
                            (cs.perOrderAmount || 0) > 0 && (
                              <View
                                style={{
                                  backgroundColor: "rgba(139,92,246,0.12)",
                                  borderRadius: 10,
                                  padding: 10,
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 8,
                                  borderWidth: 1,
                                  borderColor: "rgba(139,92,246,0.25)",
                                  marginBottom: 8,
                                }}
                              >
                                <Text style={{ fontSize: 16 }}>💵</Text>
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      fontWeight: "700",
                                      color: "#A78BFA",
                                    }}
                                  >
                                    Toplam Teslimat Başı Kazanç
                                  </Text>
                                  <Text
                                    style={{
                                      fontSize: 16,
                                      fontWeight: "900",
                                      color: "#7C3AED",
                                    }}
                                  >
                                    {(
                                      (cs.totalOrders || 0) *
                                      (cs.perOrderAmount || 0)
                                    ).toFixed(0)}
                                    ₴
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 10, color: TXT3 }}>
                                  {cs.totalOrders}×{cs.perOrderAmount}₴
                                </Text>
                              </View>
                            )}

                          {/* Bekleyen kasa */}
                          {(cs.pendingKasa || 0) > 0 && (
                            <View
                              style={{
                                backgroundColor: cs.kasaTeslimTalep
                                  ? AMBER + "15"
                                  : GREEN + "08",
                                borderRadius: 10,
                                padding: 10,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                                borderWidth: 1,
                                borderColor: cs.kasaTeslimTalep
                                  ? AMBER + "40"
                                  : GREEN + "20",
                              }}
                            >
                              <Text style={{ fontSize: 16 }}>
                                {cs.kasaTeslimTalep ? "🔔" : "💰"}
                              </Text>
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: "700",
                                    color: cs.kasaTeslimTalep ? AMBER : TXT2,
                                  }}
                                >
                                  {cs.kasaTeslimTalep
                                    ? "Teslim Talebi Var!"
                                    : "Bekleyen Net Kasa"}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "900",
                                    color: GREEN,
                                  }}
                                >
                                  {(cs.netKasa || 0).toFixed(0)}₴
                                </Text>
                              </View>
                              {cs.kasaTeslimTalep && (
                                <Pressable
                                  onPress={() =>
                                    handleKasaAction(
                                      cs.id,
                                      cs.name,
                                      "accept",
                                      cs.netKasa || 0,
                                    )
                                  }
                                  style={{
                                    backgroundColor: GREEN,
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      fontWeight: "900",
                                      color: "#fff",
                                    }}
                                  >
                                    ✅ Al
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          )}

                          {cs.kasaHistory && cs.kasaHistory.length > 0 && (
                            <View style={{ marginTop: 8 }}>
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: TXT3,
                                  marginBottom: 4,
                                }}
                              >
                                Son Teslimler:
                              </Text>
                              {cs.kasaHistory
                                .slice(-3)
                                .reverse()
                                .map((h: any, i: number) => (
                                  <View
                                    key={i}
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      gap: 6,
                                      paddingVertical: 3,
                                    }}
                                  >
                                    <Text style={{ fontSize: 13 }}>
                                      {h.action === "accept"
                                        ? "✅"
                                        : h.action === "partial"
                                          ? "⚠️"
                                          : "❌"}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: TXT2 }}>
                                      {(h.netKasa || 0).toFixed(0)}₴
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: 10,
                                        color: TXT3,
                                        flex: 1,
                                      }}
                                    >
                                      {h.at
                                        ? new Date(h.at).toLocaleDateString(
                                            [],
                                            {
                                              day: "2-digit",
                                              month: "2-digit",
                                            },
                                          )
                                        : ""}
                                    </Text>
                                  </View>
                                ))}
                            </View>
                          )}
                          <Pressable
                            onPress={() =>
                              handleResetCourierStats(cs.id, cs.name)
                            }
                            style={{
                              marginTop: 10,
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              paddingVertical: 9,
                              borderRadius: 10,
                              backgroundColor: RED + "12",
                              borderWidth: 1.5,
                              borderColor: RED + "30",
                            }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color={RED}
                            />
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "800",
                                color: RED,
                              }}
                            >
                              İstatistiği Sıfırla
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                </ScrollView>
              )}

              {/* ── AYARLAR TAB ── */}
              {adminTab === "settings" && (
                <ScrollView
                  contentContainerStyle={{
                    padding: 16,
                    paddingBottom: insets.bottom + 20,
                  }}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: TXT3,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      marginBottom: 12,
                    }}
                  >
                    Uygulama Ayarları
                  </Text>

                  {[
                    {
                      label: "Uygulama Adı",
                      value: editAppName,
                      setter: setEditAppName,
                      placeholder: "INVER Water Kurye",
                      secure: false,
                    },
                    {
                      label: "Worker URL",
                      value: editWorkerUrl,
                      setter: setEditWorkerUrl,
                      placeholder: "https://...",
                      secure: false,
                    },
                  ].map((field, i) => (
                    <View key={i} style={{ marginBottom: 14 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: TXT2,
                          marginBottom: 6,
                        }}
                      >
                        {field.label}
                      </Text>
                      <TextInput
                        value={field.value}
                        onChangeText={field.setter}
                        placeholder={field.placeholder}
                        placeholderTextColor={TXT3}
                        secureTextEntry={field.secure}
                        autoCapitalize="none"
                        style={{
                          backgroundColor: INP,
                          borderRadius: 14,
                          padding: 14,
                          fontSize: 14,
                          color: TXT,
                          borderWidth: 1.5,
                          borderColor: BDR,
                        }}
                      />
                    </View>
                  ))}

                  <Pressable
                    onPress={() =>
                      handleSaveSettings({ appNameVal: editAppName })
                    }
                    disabled={savingSettings}
                    style={{
                      backgroundColor: PURP,
                      borderRadius: 14,
                      paddingVertical: 16,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    {savingSettings ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Ionicons name="save" size={18} color="#fff" />
                    )}
                    <Text
                      style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}
                    >
                      Kaydet
                    </Text>
                  </Pressable>

                  <Text
                    style={{
                      fontSize: 11,
                      color: TXT3,
                      textAlign: "center",
                      marginTop: 4,
                    }}
                  >
                    Worker URL değişikliği için uygulamayı yeniden başlatın.
                  </Text>
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
