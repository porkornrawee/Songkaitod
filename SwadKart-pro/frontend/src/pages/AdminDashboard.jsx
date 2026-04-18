import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BASE_URL } from "../config";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ChefHat,
  TrendingUp,
  LogOut,
  Bell,
  RefreshCw,
} from "lucide-react";

/* ─────────────────────────────────────────
   CONFIG
───────────────────────────────────────── */
const POLL_INTERVAL = 5000; // ดึงข้อมูลทุก 5 วินาที

/* ─────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────── */
const STATUS = {
  pending: {
    label: "Pending",
    labelTH: "รอรับออเดอร์",
    color: "#f59e0b",
    bg: "#2d2009",
    icon: Clock,
    next: "cooking",
    nextLabel: "รับออเดอร์",
  },
  cooking: {
    label: "Cooking",
    labelTH: "กำลังทำอาหาร",
    color: "#3b82f6",
    bg: "#0d1f3c",
    icon: ChefHat,
    next: "delivered",
    nextLabel: "ส่งแล้ว",
  },
  delivered: {
    label: "Delivered",
    labelTH: "จัดส่งแล้ว",
    color: "#22c55e",
    bg: "#0a2318",
    icon: CheckCircle2,
    next: null,
    nextLabel: null,
  },
};

/* ─────────────────────────────────────────
   MOCK DATA (fallback ถ้า API ยังไม่พร้อม)
───────────────────────────────────────── */
const MOCK_ORDERS = [
  {
    _id: "ORD001",
    user: { name: "สมชาย ใจดี" },
    orderItems: [
      { name: "ไก่ทอด", qty: 2, price: 25 },
      { name: "ข้าวสวย", qty: 1, price: 15 },
    ],
    totalPrice: 65,
    orderStatus: "pending",
    createdAt: new Date(Date.now() - 120000).toISOString(),
    tableNo: "A1",
  },
  {
    _id: "ORD002",
    user: { name: "สมหญิง รักดี" },
    orderItems: [
      { name: "ดิปชีส", qty: 1, price: 30 },
      { name: "น้ำอัดลม", qty: 2, price: 20 },
    ],
    totalPrice: 70,
    orderStatus: "cooking",
    createdAt: new Date(Date.now() - 600000).toISOString(),
    tableNo: "B3",
  },
  {
    _id: "ORD003",
    user: { name: "วิชัย มีสุข" },
    orderItems: [{ name: "ส้มตำ", qty: 1, price: 45 }],
    totalPrice: 45,
    orderStatus: "delivered",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    tableNo: "C2",
  },
  {
    _id: "ORD004",
    user: { name: "นภา สวยงาม" },
    orderItems: [
      { name: "ต้มยำ", qty: 1, price: 60 },
      { name: "ไก่ทอด", qty: 1, price: 25 },
    ],
    totalPrice: 85,
    orderStatus: "pending",
    createdAt: new Date(Date.now() - 60000).toISOString(),
    tableNo: "A2",
  },
];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} วินาทีที่แล้ว`;
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.user);

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [useMock, setUseMock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const lastOrderCountRef = useRef(0);
  const ordersLengthRef = useRef(0);

  // ── Auth guard ──────────────────────────
  useEffect(() => {
    if (!userInfo || userInfo.role !== "admin") {
      navigate("/login");
    }
  }, [userInfo, navigate]);

  // ── Fetch orders from Express API ───────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/orders/allorders`, {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // รองรับทั้ง { orders: [...] } และ [...]
      const raw = Array.isArray(data) ? data : data.orders ?? [];
      const sorted = [...raw].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // แจ้งเตือนออเดอร์ใหม่
      if (lastOrderCountRef.current > 0 && sorted.length > lastOrderCountRef.current) {
        setNewOrderAlert(true);
        setTimeout(() => setNewOrderAlert(false), 4000);
      }
      lastOrderCountRef.current = sorted.length;
      ordersLengthRef.current = sorted.length;

      setOrders(sorted);
      setUseMock(false);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("API fetch failed, using mock data:", err.message);
      if (ordersLengthRef.current === 0) {
        setOrders(MOCK_ORDERS);
        setUseMock(true);
      }
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  // ── Start polling ────────────────────────
  useEffect(() => {
    if (!userInfo) return;

    fetchOrders(); // ดึงทันทีตอนโหลด

    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders, userInfo]);

  // ── Update order status ──────────────────
  const updateStatus = async (orderId, newStatus) => {
    // Optimistic update — อัปเดต UI ทันทีก่อน API ตอบ
    setOrders((prev) =>
      prev.map((o) =>
        (o._id || o.id) === orderId ? { ...o, orderStatus: newStatus } : o
      )
    );

    if (useMock) return;

    try {
      await fetch(`${BASE_URL}/api/v1/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo?.token}`,
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
    } catch (err) {
      console.error("Update status failed:", err);
      fetchOrders(); // rollback
    }
  };

  // ── Stats ────────────────────────────────
  const getStatus = (o) => o.orderStatus || o.status || "pending";
  const getTotal = (o) => o.totalPrice || o.total || 0;
  const getId = (o) => o._id || o.id;

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => getStatus(o) === "pending").length,
    cooking: orders.filter((o) => getStatus(o) === "cooking").length,
    delivered: orders.filter((o) => getStatus(o) === "delivered").length,
    todayRevenue: orders
      .filter(
        (o) =>
          getStatus(o) === "delivered" &&
          new Date(o.createdAt).toDateString() === new Date().toDateString()
      )
      .reduce((s, o) => s + getTotal(o), 0),
  };

  const filtered =
    filter === "all" ? orders : orders.filter((o) => getStatus(o) === filter);

  return (
    <div style={s.wrapper}>
      {/* ── Navbar ── */}
      <nav style={s.navbar}>
        <div style={s.navLeft}>
          <span style={s.logo}>
            Song<span style={s.red}>kaitod</span>
            <span style={s.red}>.</span>
          </span>
          <span style={s.navTitle}>Admin Dashboard</span>
        </div>
        <div style={s.navRight}>
          {useMock && <span style={s.mockBadge}>⚠ Mock Data</span>}
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
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </nav>

      {/* ── New order toast ── */}
      {newOrderAlert && (
        <div style={s.toast}>🔔 มีออเดอร์ใหม่เข้ามา!</div>
      )}

      <div style={s.content}>
        {loading ? (
          <div style={s.loadingWrap}>
            <RefreshCw size={28} color="#ff4d4d" style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#555", marginTop: 12 }}>กำลังโหลดออเดอร์...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div style={s.statsGrid}>
              <StatCard icon={<ShoppingBag size={22} color="#fff" />} label="ทั้งหมด" value={stats.total} color="#6366f1" />
              <StatCard icon={<Clock size={22} color="#fff" />} label="รอรับ" value={stats.pending} color="#f59e0b" />
              <StatCard icon={<ChefHat size={22} color="#fff" />} label="กำลังทำ" value={stats.cooking} color="#3b82f6" />
              <StatCard icon={<CheckCircle2 size={22} color="#fff" />} label="จัดส่งแล้ว" value={stats.delivered} color="#22c55e" />
              <StatCard
                icon={<TrendingUp size={22} color="#fff" />}
                label="รายได้วันนี้"
                value={`฿${stats.todayRevenue.toFixed(0)}`}
                color="#ff4d4d"
                wide
              />
            </div>

            {/* ── Filter Tabs ── */}
            <div style={s.filterRow}>
              <span style={s.sectionTitle}>รายการออเดอร์</span>
              <div style={s.tabs}>
                {["all", "pending", "cooking", "delivered"].map((tab) => (
                  <button
                    key={tab}
                    style={{ ...s.tab, ...(filter === tab ? s.tabActive : {}) }}
                    onClick={() => setFilter(tab)}
                  >
                    {tab === "all" ? `ทั้งหมด (${stats.total})`
                      : tab === "pending" ? `รอรับ (${stats.pending})`
                      : tab === "cooking" ? `กำลังทำ (${stats.cooking})`
                      : `จัดส่งแล้ว (${stats.delivered})`}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Order Cards ── */}
            <div style={s.orderGrid}>
              {filtered.length === 0 ? (
                <div style={s.empty}>ไม่มีออเดอร์ในหมวดนี้</div>
              ) : (
                filtered.map((order) => (
                  <OrderCard
                    key={getId(order)}
                    order={order}
                    onUpdateStatus={updateStatus}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
const StatCard = ({ icon, label, value, color, wide }) => (
  <div style={{ ...s.statCard, gridColumn: wide ? "span 2" : "span 1" }}>
    <div style={{ ...s.statIcon, background: color }}>{icon}</div>
    <div>
      <p style={s.statLabel}>{label}</p>
      <p style={{ ...s.statValue, color }}>{value}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────
   ORDER CARD
───────────────────────────────────────── */
const OrderCard = ({ order, onUpdateStatus }) => {
  const statusKey = order.orderStatus || order.status || "pending";
  const cfg = STATUS[statusKey] || STATUS.pending;
  const Icon = cfg.icon;
  const id = order._id || order.id;
  const customerName = order.user?.name || order.customerName || "ลูกค้า";
  const items = order.orderItems || order.items || [];
  const total = order.totalPrice || order.total || 0;

  return (
    <div style={{ ...s.orderCard, borderTop: `3px solid ${cfg.color}` }}>
      <div style={s.orderHeader}>
        <div>
          <span style={s.orderId}>#{id?.slice(-6)}</span>
          {order.tableNo && <span style={s.tableNo}>โต๊ะ {order.tableNo}</span>}
        </div>
        <div style={{ ...s.statusBadge, background: cfg.bg, color: cfg.color }}>
          <Icon size={13} />
          {cfg.labelTH}
        </div>
      </div>

      <p style={s.customerName}>{customerName}</p>
      <p style={s.timeAgo}>{timeAgo(order.createdAt)}</p>

      <div style={s.itemsList}>
        {items.map((item, i) => (
          <div key={i} style={s.itemRow}>
            <span style={s.itemName}>{item.name} × {item.qty}</span>
            <span style={s.itemPrice}>฿{(item.price * item.qty).toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div style={s.totalRow}>
        <span style={s.totalLabel}>รวม</span>
        <span style={s.totalValue}>฿{total.toFixed(2)}</span>
      </div>

      {cfg.next && (
        <button
          style={{ ...s.actionBtn, background: STATUS[cfg.next].color }}
          onClick={() => onUpdateStatus(id, cfg.next)}
        >
          {cfg.nextLabel} →
        </button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const s = {
  wrapper: { background: "#0a0e1a", minHeight: "100vh", color: "#fff", fontFamily: "'Segoe UI', sans-serif" },
  navbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", borderBottom: "1px solid #1e2640", background: "#0d1221" },
  navLeft: { display: "flex", alignItems: "center", gap: 16 },
  logo: { fontSize: 20, fontWeight: 700 },
  red: { color: "#ff4d4d" },
  navTitle: { fontSize: 13, color: "#555", letterSpacing: 2, textTransform: "uppercase", borderLeft: "1px solid #1e2640", paddingLeft: 16 },
  navRight: { display: "flex", alignItems: "center", gap: 16 },
  mockBadge: { background: "#2d2009", color: "#f59e0b", fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 600 },
  updatedAt: { display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#444" },
  alertDot: { position: "absolute", top: 0, right: 0, width: 8, height: 8, background: "#ff4d4d", borderRadius: "50%" },
  logoutBtn: { background: "transparent", border: "1px solid #1e2640", color: "#888", padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  toast: { position: "fixed", top: 70, right: 24, background: "#ff4d4d", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 1000, boxShadow: "0 4px 20px rgba(255,77,77,0.4)" },
  content: { padding: "28px 32px" },
  loadingWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 },
  statCard: { background: "#131929", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 },
  statIcon: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statLabel: { fontSize: 12, color: "#666", margin: "0 0 4px", letterSpacing: 1 },
  statValue: { fontSize: 24, fontWeight: 800, margin: 0 },
  filterRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 700 },
  tabs: { display: "flex", gap: 8 },
  tab: { background: "#131929", border: "1px solid #1e2640", color: "#666", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 },
  tabActive: { background: "#ff4d4d", border: "1px solid #ff4d4d", color: "#fff" },
  orderGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  empty: { color: "#555", fontSize: 15, padding: "40px 0", gridColumn: "1/-1" },
  orderCard: { background: "#131929", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 8 },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 14, fontWeight: 700, color: "#fff" },
  tableNo: { fontSize: 12, color: "#888", background: "#1e2640", padding: "2px 8px", borderRadius: 6, marginLeft: 8 },
  statusBadge: { display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20 },
  customerName: { fontSize: 15, fontWeight: 600, margin: 0, color: "#ddd" },
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