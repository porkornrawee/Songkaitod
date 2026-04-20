import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BASE_URL } from "../config";
import { io } from "socket.io-client";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  TrendingUp,
  LogOut,
  Bell,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

/* ─────────────────────────────────────────
   CONFIG
───────────────────────────────────────── */
const POLL_INTERVAL = 5000; // polling ทุก 5 วิ เป็น realtime fallback

/* ─────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────── */
const STATUS = {
  Placed: {
    labelTH: "รอรับออเดอร์",
    color: "#f59e0b",
    bg: "#2d2009",
    icon: Clock,
    next: "Preparing",
    nextLabel: "รับออเดอร์ / เริ่มทำ",
  },
  Preparing: {
    labelTH: "กำลังทำอาหาร",
    color: "#3b82f6",
    bg: "#0d1f3c",
    icon: ChefHat,
    next: "Ready",
    nextLabel: "พร้อมส่ง",
  },
  Ready: {
    labelTH: "พร้อมส่ง",
    color: "#a855f7",
    bg: "#1a0d2e",
    icon: ShoppingBag,
    next: "Delivered",
    nextLabel: "ส่งแล้ว",
  },
  Delivered: {
    labelTH: "จัดส่งแล้ว",
    color: "#22c55e",
    bg: "#0a2318",
    icon: CheckCircle2,
    next: null,
    nextLabel: null,
  },
  Cancelled: {
    labelTH: "ยกเลิกแล้ว",
    color: "#ef4444",
    bg: "#2d0a0a",
    icon: Clock,
    next: null,
    nextLabel: null,
  },
};

const DEFAULT_STATUS = {
  labelTH: "ไม่ทราบสถานะ",
  color: "#666",
  bg: "#1a1a1a",
  icon: Clock,
  next: null,
  nextLabel: null,
};

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} วินาทีที่แล้ว`;
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
};

const getId = (o) => o._id || o.id;
const getStatus = (o) => o.orderStatus || o.status || "Placed";
const getTotal = (o) => o.totalPrice || o.total || 0;

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.user);

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const orderIdsRef = useRef(new Set());

  // ── Auth guard ──────────────────────────
  useEffect(() => {
    if (!userInfo || userInfo.role !== "admin") {
      navigate("/login");
    }
  }, [userInfo, navigate]);

  // ── Fetch all orders from API ────────────
  const fetchOrders = useCallback(async () => {
    if (!userInfo?.token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/orders`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : data.orders ?? [];
      const sorted = [...raw].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      sorted.forEach((o) => orderIdsRef.current.add(getId(o)));
      setOrders(sorted);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("Fetch orders failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  // ── Socket.io — เชื่อมต่อ realtime ─────
  useEffect(() => {
    if (!userInfo?.token) return;

    // แก้ไขให้รองรับ WebSocket เต็มรูปแบบ
    const socket = io(BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("joinOrder", userInfo._id);
      socket.emit("joinOrder", "admin"); // เผื่อ Backend ส่งเข้าห้อง admin
      console.log("🔌 Admin socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      console.log("❌ Admin socket disconnected");
    });

    socket.on("newOrderReceived", (newOrder) => {
      console.log("🆕 New order via socket:", newOrder._id);
      const newId = getId(newOrder);

      if (orderIdsRef.current.has(newId)) return;
      orderIdsRef.current.add(newId);

      setOrders((prev) => [newOrder, ...prev]);
      setNewOrderAlert({
        id: newId,
        name: newOrder.user?.name || newOrder.shippingAddress?.fullName || "ลูกค้า",
        total: newOrder.totalPrice,
      });
      setTimeout(() => setNewOrderAlert(null), 5000);
      setLastUpdated(new Date());
    });

    socket.on("orderUpdated", (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (getId(o) === getId(updatedOrder) ? updatedOrder : o))
      );
      setLastUpdated(new Date());
    });

    return () => {
      socket.disconnect();
    };
  }, [userInfo]);

  // ── Polling สำรอง ────────────────────────
  useEffect(() => {
    if (!userInfo) return;
    fetchOrders(); 
    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders, userInfo]);

  // ── Update order status ──────────────────
  const updateStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (getId(o) === orderId ? { ...o, orderStatus: newStatus } : o))
    );
    try {
      await fetch(`${BASE_URL}/api/v1/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo?.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch  {
      fetchOrders(); 
    }
  };

  const stats = {
    total: orders.length,
    placed: orders.filter((o) => getStatus(o) === "Placed").length,
    preparing: orders.filter((o) => getStatus(o) === "Preparing").length,
    delivered: orders.filter((o) => getStatus(o) === "Delivered").length,
    todayRevenue: orders
      .filter(
        (o) =>
          getStatus(o) === "Delivered" &&
          new Date(o.createdAt).toDateString() === new Date().toDateString()
      )
      .reduce((s, o) => s + getTotal(o), 0),
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => getStatus(o) === filter);

  return (
    <div style={s.wrapper}>
      <nav style={s.navbar}>
        <div style={s.navLeft}>
          <span style={s.logo}>Song<span style={s.red}>kaitod</span><span style={s.red}>.</span></span>
          <span style={s.navTitle}>Admin Dashboard</span>
        </div>
        <div style={s.navRight}>
          <div style={socketConnected ? s.socketBadgeOn : s.socketBadgeOff}>
            {socketConnected ? <><Wifi size={12} /> Realtime</> : <><WifiOff size={12} /> Polling</>}
          </div>
          {lastUpdated && (
            <span style={s.updatedAt}>
              <RefreshCw size={11} />
              {lastUpdated.toLocaleTimeString("th-TH")}
            </span>
          )}
          <div style={{ position: "relative" }}>
            <Bell size={22} color={newOrderAlert ? "#ff4d4d" : "#666"} />
            {newOrderAlert && <span style={s.alertDot} />}
          </div>
          <button style={s.logoutBtn} onClick={() => navigate("/login")}>
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </nav>

      {newOrderAlert && (
        <div style={s.toast}>
          🔔 ออเดอร์ใหม่จาก <strong>{newOrderAlert.name}</strong>! ฿{newOrderAlert.total?.toFixed(0)}
        </div>
      )}

      <div style={s.content}>
        {loading ? (
          <div style={s.loadingWrap}>
            <RefreshCw size={28} color="#ff4d4d" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#555", marginTop: 12 }}>กำลังโหลดออเดอร์...</p>
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        ) : (
          <>
            <div style={s.statsGrid}>
              <StatCard icon={<ShoppingBag size={22} color="#fff" />} label="ทั้งหมด" value={stats.total} color="#6366f1" />
              <StatCard icon={<Clock size={22} color="#fff" />} label="รอรับ" value={stats.placed} color="#f59e0b" />
              <StatCard icon={<ChefHat size={22} color="#fff" />} label="กำลังทำ" value={stats.preparing} color="#3b82f6" />
              <StatCard icon={<CheckCircle2 size={22} color="#fff" />} label="จัดส่งแล้ว" value={stats.delivered} color="#22c55e" />
              <StatCard icon={<TrendingUp size={22} color="#fff" />} label="รายได้วันนี้" value={`฿${stats.todayRevenue.toFixed(0)}`} color="#ff4d4d" wide />
            </div>

            <div style={s.filterRow}>
              <span style={s.sectionTitle}>รายการออเดอร์</span>
              <div style={s.tabs}>
                {[
                  { key: "all", label: `ทั้งหมด (${stats.total})` },
                  { key: "Placed", label: `รอรับ (${stats.placed})` },
                  { key: "Preparing", label: `กำลังทำ (${stats.preparing})` },
                  { key: "Delivered", label: `จัดส่งแล้ว (${stats.delivered})` },
                ].map(({ key, label }) => (
                  <button key={key} style={{ ...s.tab, ...(filter === key ? s.tabActive : {}) }} onClick={() => setFilter(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.orderGrid}>
              {filtered.length === 0 ? (
                <div style={s.empty}>ไม่มีออเดอร์ในหมวดนี้</div>
              ) : (
                filtered.map((order) => (
                  <OrderCard key={getId(order)} order={order} onUpdateStatus={updateStatus} isNew={newOrderAlert?.id === getId(order)} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, wide }) => (
  <div style={{ ...s.statCard, gridColumn: wide ? "span 2" : "span 1" }}>
    <div style={{ ...s.statIcon, background: color }}>{icon}</div>
    <div>
      <p style={s.statLabel}>{label}</p>
      <p style={{ ...s.statValue, color }}>{value}</p>
    </div>
  </div>
);

const OrderCard = ({ order, onUpdateStatus, isNew }) => {
  const statusKey = getStatus(order);
  const cfg = STATUS[statusKey] || DEFAULT_STATUS;
  const Icon = cfg.icon;
  const id = getId(order);
  const customerName = order.user?.name || order.shippingAddress?.fullName || order.customerName || "ลูกค้า";
  const items = order.orderItems || order.items || [];
  const total = getTotal(order);

  return (
    <div style={{
      ...s.orderCard,
      borderTop: `3px solid ${cfg.color}`,
      ...(isNew ? { boxShadow: `0 0 20px ${cfg.color}44`, animation: "pulse 1s ease-in-out 3" } : {}),
    }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
      <div style={s.orderHeader}>
        <div>
          <span style={s.orderId}>#{id?.slice(-6)}</span>
          {order.tableNo && <span style={s.tableNo}>โต๊ะ {order.tableNo}</span>}
        </div>
        <div style={{ ...s.statusBadge, background: cfg.bg, color: cfg.color }}>
          <Icon size={13} /> {cfg.labelTH}
        </div>
      </div>
      <p style={s.customerName}>{customerName}</p>
      <p style={s.customerEmail}>{order.user?.email || ""}</p>
      <p style={s.timeAgo}>{timeAgo(order.createdAt)}</p>
      <div style={s.itemsList}>
        {items.map((item, i) => (
          <div key={i} style={s.itemRow}>
            <span style={s.itemName}>{item.name} × {item.qty}</span>
            <span style={s.itemPrice}>฿{((item.price || 0) * (item.qty || 1)).toFixed(0)}</span>
          </div>
        ))}
      </div>
      <div style={s.totalRow}>
        <span style={s.totalLabel}>รวม</span>
        <span style={s.totalValue}>฿{total.toFixed(2)}</span>
      </div>
      {cfg.next && (
        <button style={{ ...s.actionBtn, background: (STATUS[cfg.next] || DEFAULT_STATUS).color }} onClick={() => onUpdateStatus(id, cfg.next)}>
          {cfg.nextLabel} →
        </button>
      )}
    </div>
  );
};

const s = {
  wrapper: { background: "#0a0e1a", minHeight: "100vh", color: "#fff", fontFamily: "'Segoe UI', sans-serif" },
  navbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", borderBottom: "1px solid #1e2640", background: "#0d1221" },
  navLeft: { display: "flex", alignItems: "center", gap: 16 },
  logo: { fontSize: 20, fontWeight: 700 },
  red: { color: "#ff4d4d" },
  navTitle: { fontSize: 13, color: "#555", letterSpacing: 2, textTransform: "uppercase", borderLeft: "1px solid #1e2640", paddingLeft: 16 },
  navRight: { display: "flex", alignItems: "center", gap: 16 },
  socketBadgeOn: { display: "flex", alignItems: "center", gap: 5, background: "#0a2318", color: "#22c55e", border: "1px solid #22c55e44", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  socketBadgeOff: { display: "flex", alignItems: "center", gap: 5, background: "#2d2009", color: "#f59e0b", border: "1px solid #f59e0b44", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 },
  updatedAt: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#444" },
  alertDot: { position: "absolute", top: 0, right: 0, width: 8, height: 8, background: "#ff4d4d", borderRadius: "50%" },
  logoutBtn: { background: "transparent", border: "1px solid #1e2640", color: "#888", padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  toast: { position: "fixed", top: 70, right: 24, background: "#ff4d4d", color: "#fff", padding: "14px 22px", borderRadius: 12, fontWeight: 600, fontSize: 14, zIndex: 1000, boxShadow: "0 4px 24px rgba(255,77,77,0.5)", animation: "slideIn 0.3s ease" },
  content: { padding: "28px 32px" },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 },
  statCard: { background: "#131929", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 },
  statIcon: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statLabel: { fontSize: 12, color: "#666", margin: "0 0 4px", letterSpacing: 1 },
  statValue: { fontSize: 24, fontWeight: 800, margin: 0 },
  filterRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 700 },
  tabs: { display: "flex", gap: 8, flexWrap: "wrap" },
  tab: { background: "#131929", border: "1px solid #1e2640", color: "#666", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 },
  tabActive: { background: "#ff4d4d", border: "1px solid #ff4d4d", color: "#fff" },
  orderGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  empty: { color: "#555", fontSize: 15, padding: "40px 0", gridColumn: "1/-1", textAlign: "center" },
  orderCard: { background: "#131929", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 8 },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 14, fontWeight: 700, color: "#fff" },
  tableNo: { fontSize: 12, color: "#888", background: "#1e2640", padding: "2px 8px", borderRadius: 6, marginLeft: 8 },
  statusBadge: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 },
  customerName: { fontSize: 15, fontWeight: 600, margin: 0, color: "#ddd" },
  customerEmail: { fontSize: 11, color: "#444", margin: 0 },
  timeAgo: { fontSize: 12, color: "#555", margin: 0 },
  itemsList: { background: "#0d1221", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4, margin: "4px 0" },
  itemRow: { display: "flex", justifyContent: "space-between" },
  itemName: { fontSize: 13, color: "#aaa" },
  itemPrice: { fontSize: 13, color: "#ccc", fontWeight: 500 },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid #1e2640" },
  totalLabel: { fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 1 },
  totalValue: { fontSize: 16, fontWeight: 800, color: "#ff4d4d" },
  actionBtn: { border: "none", color: "#fff", padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1, marginTop: 4 },
};

export default AdminDashboard;