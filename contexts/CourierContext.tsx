import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "on_the_way"
  | "delivered"
  | "cancelled";
export type Language = "tr" | "uk" | "en" | "ru";

export interface CourierOrder {
  orderId: string;
  date: string;
  name: string;
  phone: string;
  city: string;
  street: string;
  building: string;
  flat?: string;
  liters: number;
  deposits: number;
  total: number;
  discountCode?: string;
  discountAmount?: number;
  status: OrderStatus;
  courierId?: string;
  courierName?: string;
  acceptedAt?: string;
  onTheWayAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  savedAt?: string;
}

export interface CourierProfile {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  gender?: "male" | "female";
  paymentType?: "per_order" | "salary";
  perOrderAmount?: number;
  salaryAmount?: number;
  kasaResetAt?: string | null;
  kasaTeslimTalep?: boolean;
}

export interface ShiftStats {
  orders: number;
  liters: number;
  earnings: number;
  started: string | null;
}

interface ContextValue {
  courier: CourierProfile | null;
  workerUrl: string;
  setWorkerUrl: (url: string) => Promise<void>;
  appName: string;
  setAppName: (name: string) => Promise<void>;
  isLoaded: boolean;
  login: (
    url: string,
    password: string,
    rememberPw?: boolean,
    autoLogin?: boolean,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  language: Language;
  setLanguage: (l: Language) => void;
  orders: CourierOrder[];
  pendingOrders: CourierOrder[];
  activeOrder: CourierOrder | null;
  todayOrders: CourierOrder[];
  allOrders: CourierOrder[];
  historyOrders: CourierOrder[];
  refreshOrders: () => Promise<void>;
  isRefreshing: boolean;
  acceptOrder: (id: string) => Promise<void>;
  rejectOrder: (id: string) => Promise<void>;
  startDelivery: (id: string) => Promise<void>;
  completeOrder: (id: string) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  shiftActive: boolean;
  shiftStats: ShiftStats;
  startShift: () => void;
  endShift: () => void;
  newOrderAlert: boolean;
  clearNewOrderAlert: () => void;
  kasaTeslimTalep: () => Promise<void>;
  statsSnapshot: {
    totalOrders: number;
    totalKasa: number;
    totalLiters: number;
    totalCourierEarnings: number;
  } | null;
}

const CC = createContext<ContextValue | null>(null);

const WORKER_KEY = "@inver_courier_worker";
const SESSION_KEY = "@inver_courier_session";
const LANG_KEY = "@inver_courier_lang";

export function CourierProvider({ children }: { children: ReactNode }) {
  const [courier, setCourier] = useState<CourierProfile | null>(null);
  const [workerUrl, setWorkerUrlState] = useState(
    "https://inver2.inver2.workers.dev",
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [appName, setAppNameState] = useState("INVER Water Kurye");
  const [language, setLangState] = useState<Language>("tr");
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<CourierOrder[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftStats, setShiftStats] = useState<ShiftStats>({
    orders: 0,
    liters: 0,
    earnings: 0,
    started: null,
  });
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [statsSnapshot, setStatsSnapshot] = useState<{
    totalOrders: number;
    totalKasa: number;
    totalLiters: number;
    totalCourierEarnings: number;
  } | null>(null);
  const pollRef = useRef<any>(null);
  const prevPendingCount = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [w, s, l] = await Promise.all([
          AsyncStorage.getItem(WORKER_KEY),
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(LANG_KEY),
        ]);
        const n = await AsyncStorage.getItem("@inver_courier_appname");
        if (w) setWorkerUrlState(w);
        if (l) setLangState(l as Language);
        if (n) setAppNameState(n);
        // Otomatik giriş
        const savedPw = await AsyncStorage.getItem("@inver_courier_pw");
        const autoL = await AsyncStorage.getItem("@inver_courier_autologin");
        if (s) {
          // Session var, direkt yükle
          const loadedCourier = JSON.parse(s);
          setCourier(loadedCourier);
        } else if (savedPw && autoL === "1" && w) {
          // Şifre kayıtlı ve oto-giriş açık: yeniden auth
          try {
            const base = w.trim().replace(/\/$/, "");
            const r = await fetch(`${base}/courier-auth`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password: savedPw }),
            });
            if (r.ok) {
              const d = await r.json();
              if (d.ok) {
                await AsyncStorage.setItem(
                  SESSION_KEY,
                  JSON.stringify(d.courier),
                );
                setCourier(d.courier);
              }
            }
          } catch {}
        }
      } catch {}
      setIsLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!courier || !workerUrl) return;
    refreshOrders();
    pollRef.current = setInterval(refreshOrders, 6000); // 6 saniyede bir
    return () => clearInterval(pollRef.current);
  }, [courier, workerUrl]);

  const login = useCallback(
    async (
      url: string,
      password: string,
      rememberPw: boolean = true,
      autoLogin: boolean = true,
    ): Promise<{ ok: boolean; error?: string }> => {
      const base = url.trim().replace(/\/$/, "");
      try {
        const r = await fetch(`${base}/courier-auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!r.ok) return { ok: false, error: "Bağlantı hatası" };
        const d = await r.json();
        if (!d.ok) return { ok: false, error: d.error || "Şifre yanlış" };
        await AsyncStorage.setItem(WORKER_KEY, base);
        // Şifreyi kaydet (otomatik giriş için)
        if (rememberPw) {
          await AsyncStorage.setItem("@inver_courier_pw", password);
          await AsyncStorage.setItem(
            "@inver_courier_autologin",
            autoLogin ? "1" : "0",
          );
        } else {
          await AsyncStorage.removeItem("@inver_courier_pw");
          await AsyncStorage.setItem("@inver_courier_autologin", "0");
        }
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(d.courier));
        setWorkerUrlState(base);
        setCourier(d.courier);
        return { ok: true };
      } catch {
        return { ok: false, error: "Sunucuya ulaşılamadı" };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    // FCM token'ı worker'dan sil
    if (courier && workerUrl) {
      try {
        await fetch(`${workerUrl}/courier-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courierId: courier.id, remove: true }),
        });
      } catch {}
    }
    await AsyncStorage.multiRemove([SESSION_KEY]);
    setCourier(null);
    setOrders([]);
    clearInterval(pollRef.current);
  }, [courier, workerUrl]);

  const setLanguage = useCallback(async (l: Language) => {
    setLangState(l);
    await AsyncStorage.setItem(LANG_KEY, l);
  }, []);

  const setAppName = useCallback(async (name: string) => {
    setAppNameState(name);
    await AsyncStorage.setItem("@inver_courier_appname", name);
  }, []);

  const setWorkerUrl = useCallback(async (url: string) => {
    const base = url.trim().replace(/\/$/, "");
    setWorkerUrlState(base);
    await AsyncStorage.setItem(WORKER_KEY, base);
  }, []);

  // Kurye profilini worker'dan tazele (kasaResetAt için)
  const refreshCourierProfile = useCallback(async () => {
    if (!workerUrl || !courier) return;
    try {
      const res = await fetch(
        `${workerUrl}/courier-me?courierId=${courier.id}`,
      );
      if (res.ok) {
        const d = await res.json();
        if (d.ok && d.courier) {
          setCourier(d.courier);
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(d.courier));
        }
      }
    } catch {}
  }, [workerUrl, courier]);

  const refreshOrders = useCallback(async () => {
    if (!workerUrl || !courier) return;
    setIsRefreshing(true);
    // Snapshot'ı da çek (silinmiş sipariş istatistikleri)
    try {
      const snapRes = await fetch(
        `${workerUrl}/courier-stats-snapshot?courierId=${courier.id}`,
      );
      if (snapRes.ok) {
        const snapData = await snapRes.json();
        if (snapData.ok) setStatsSnapshot(snapData.snapshot);
      }
    } catch {}
    try {
      // Aktif siparişler
      const r = await fetch(
        `${workerUrl}/courier-orders?courierId=${courier.id}&mode=active`,
      );
      if (r.ok) {
        const fresh: CourierOrder[] = await r.json();
        const pendingCount = fresh.filter((o) => o.status === "pending").length;
        if (pendingCount > prevPendingCount.current) setNewOrderAlert(true);
        prevPendingCount.current = pendingCount;
        setOrders(fresh);
      }
      // Geçmiş siparişler (ayrı çek)
      const rh = await fetch(
        `${workerUrl}/courier-orders?courierId=${courier.id}&mode=history`,
      );
      if (rh.ok) {
        const hist: CourierOrder[] = await rh.json();
        setHistoryOrders(hist);
      }
    } catch {}
    setIsRefreshing(false);
  }, [workerUrl, courier]);

  const acceptOrder = useCallback(
    async (orderId: string) => {
      if (!courier) return;
      try {
        await fetch(`${workerUrl}/courier-accept`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            courierId: courier.id,
            courierName: courier.name,
          }),
        });
        await refreshOrders();
      } catch {}
    },
    [workerUrl, courier, refreshOrders],
  );

  const rejectOrder = useCallback(
    async (orderId: string) => {
      if (!courier) return;
      try {
        await fetch(`${workerUrl}/courier-reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, courierId: courier.id }),
        });
        // Önce state'den hemen kaldır — UI anında güncellensin
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
        await refreshOrders();
      } catch {}
    },
    [workerUrl, courier, refreshOrders],
  );

  const startDelivery = useCallback(
    async (orderId: string) => {
      try {
        await fetch(`${workerUrl}/order-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            status: "on_the_way",
            courierId: courier?.id,
          }),
        });
        await refreshOrders();
      } catch {}
    },
    [workerUrl, courier, refreshOrders],
  );

  const completeOrder = useCallback(
    async (orderId: string) => {
      try {
        await fetch(`${workerUrl}/order-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            status: "delivered",
            courierId: courier?.id,
          }),
        });
        const done = orders.find((o) => o.orderId === orderId);
        if (done) {
          setShiftStats((p) => ({
            ...p,
            orders: p.orders + 1,
            liters: p.liters + (done.liters || 0),
            earnings: p.earnings + (done.total || 0),
          }));
        }
        await refreshOrders();
      } catch {}
    },
    [workerUrl, courier, orders, refreshOrders],
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      try {
        await fetch(`${workerUrl}/order-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            status: "cancelled",
            courierId: courier?.id,
          }),
        });
        await refreshOrders();
      } catch {}
    },
    [workerUrl, courier, refreshOrders],
  );

  const kasaTeslimTalep = useCallback(async () => {
    if (!courier || !workerUrl) return;
    try {
      await fetch(`${workerUrl}/courier-kasa-talep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courierId: courier.id }),
      });
    } catch {}
  }, [workerUrl, courier]);

  // Admin kasa onayladığında profili tazele (kasaResetAt güncellensin)
  useEffect(() => {
    if (!courier || !workerUrl) return;
    const interval = setInterval(refreshCourierProfile, 15000); // 15 sn
    return () => clearInterval(interval);
  }, [courier, workerUrl, refreshCourierProfile]);

  const startShift = useCallback(() => {
    setShiftActive(true);
    setShiftStats({
      orders: 0,
      liters: 0,
      earnings: 0,
      started: new Date().toISOString(),
    });
  }, []);

  const endShift = useCallback(() => setShiftActive(false), []);
  const clearNewOrderAlert = useCallback(() => setNewOrderAlert(false), []);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const activeOrder =
    orders.find((o) => o.status === "accepted" || o.status === "on_the_way") ||
    null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(
    (o) =>
      o.status === "delivered" &&
      (o.deliveredAt || o.date || "").startsWith(todayStr),
  );
  const allOrders = orders;

  return (
    <CC.Provider
      value={{
        courier,
        workerUrl,
        appName,
        setAppName,
        isLoaded,
        login,
        logout,
        language,
        setLanguage,
        orders,
        pendingOrders,
        activeOrder,
        todayOrders,
        allOrders,
        historyOrders,
        refreshOrders,
        setWorkerUrl,
        isRefreshing,
        acceptOrder,
        rejectOrder,
        startDelivery,
        completeOrder,
        cancelOrder,
        shiftActive,
        shiftStats,
        startShift,
        endShift,
        newOrderAlert,
        clearNewOrderAlert,
        kasaTeslimTalep,
        statsSnapshot,
      }}
    >
      {children}
    </CC.Provider>
  );
}

export function useCourier() {
  const c = useContext(CC);
  if (!c) throw new Error("useCourier must be inside CourierProvider");
  return c;
}
