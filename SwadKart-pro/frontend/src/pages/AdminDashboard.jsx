import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { db } from "../config/firebase"; // ← import firebase config ของคุณ
import { ref, onValue, update } from "firebase/database";
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
   MOCK DATA (ใช้เมื่อ Firebase ยังไม่มีข้อมูล)
───────────────────────────────────────── */
const MOCK_ORDERS = [
  {
    id: "ORD001",
    customerName: "สมชาย ใจดี",
    items: [{ name: "ไก่ทอด", qty: 2, price: 25 }, { name: "ข้าวสวย", qty: 1, price: 15 }],
    total: 65,
    status: "pending",
    createdAt: Date.now() - 120000,
    tableNo: "A1",
  },
  {
    id: "ORD002",
    customerName: "สมหญิง รักดี",
    items: [{ name: "ดิปชีส", qty: 1, price: 30 }, { name: "น้ำอัดลม", qty: 2, price: 20 }],
    total: 70,
    status: "cooking",
    createdAt: Date.now() - 600000,
    tableNo: "B3",
  },
  {
    id: "ORD003",
    customerName: "วิชัย มีสุข",
    items: [{ name: "ส้มตำ", qty: 1, price: 45 }],
    total: 45,
    status: "delivered",
    createdAt: Date.now() - 3600000,
    tableNo: "C2",
  },
  {
    id: "ORD004",
    customerName: "นภา สวยงาม",
    items: [{ name: "ต้มยำ", qty: 1, price: 60 }, { name: "ไก่ทอด", qty: 1, price: 25 }],
    total: 85,
    status: "pending",
    createdAt: Date.now() - 60000,
    tableNo: "A2",
  },
];

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() - ts) / 1000);
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
  // useRef to track previous count without triggering re-renders
  const lastOrderCountRef = useRef(0);

  // ── Auth guard ──────────────────────────
  useEffect(() => {
    if (!userInfo || userInfo.role !== "admin") {
      navigate("/login");
    }
  }, [userInfo, navigate]);

  // ── Firebase listener ───────────────────
  useEffect(() => {
    // Fallback helper — called only inside async callbacks, never in effect body
    const applyMock = () => {
      setOrders(MOCK_ORDERS);
      setUseMock(true);
    };

    let unsubscribe;

    const setupListener = () => {
      const ordersRef = ref(db, "orders");
      unsubscribe = onValue(
        ordersRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const parsed = Object.entries(data).map(([id, val]) => ({
              id,
              ...val,
            }));
            const sorted = parsed.sort((a, b) => b.createdAt - a.createdAt);

            // New order notification (runs inside the onValue callback ✓)
            if (lastOrderCountRef.current > 0 && sorted.length > lastOrderCountRef.current) {
              setNewOrderAlert(true);
              setTimeout(() => setNewOrderAlert(false), 4000);
            }
            lastOrderCountRef.current = sorted.length;
            setOrders(sorted);
          } else {
            // setState inside onValue callback — not in effect body ✓
            applyMock();
          }
        },
        (error) => {
          // setState inside error callback — not in effect body ✓
          console.error("Firebase error:", error);
          applyMock();
        }
      );
    };

    setupListener();

    return () => unsubscribe && unsubscribe();
  }, []);

  // ── Update status ────────────────────────
  const updateStatus = async (orderId, newStatus) => {
    if (useMock) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      return;
    }
    try {
      await update(ref(db, `orders/${orderId}`), { status: newStatus });
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // ── Stats ────────────────────────────────
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    cooking: orders.filter((o) => o.status === "cooking").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + (o.total || 0), 0),
    todayRevenue: orders
      .filter(
        (o) =>
          o.status === "delivered" &&
          new Date(o.createdAt).toDateString() === new Date().toDateString()
      )
      .reduce((s, o) => s + (o.total || 0), 0),
  };

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

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
          {useMock && (
            <span style={s.mockBadge}>⚠ Mock Data</span>
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
        <div style={s.toast}>
          🔔 มีออเดอร์ใหม่เข้ามา!
        </div>
      )}

      <div style={s.content}>
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
                style={{
                  ...s.tab,
                  ...(filter === tab ? s.tabActive : {}),
                }}
                onClick={() => setFilter(tab)}
              >
                {tab === "all"
                  ? `ทั้งหมด (${stats.total})`
                  : tab === "pending"
                  ? `รอรับ (${stats.pending})`
                  : tab === "cooking"
                  ? `กำลังทำ (${stats.cooking})`
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
                key={order.id}
                order={order}
                onUpdateStatus={updateStatus}
              />
            ))
          )}
        </div>
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
  const cfg = STATUS[order.status] || STATUS.pending;
  const Icon = cfg.icon;

  return (
    <div style={{ ...s.orderCard, borderTop: `3px solid ${cfg.color}` }}>
      {/* Header */}
      <div style={s.orderHeader}>
        <div>
          <span style={s.orderId}>#{order.id?.slice(-6)}</span>
          {order.tableNo && (
            <span style={s.tableNo}>โต๊ะ {order.tableNo}</span>
          )}
        </div>
        <div style={{ ...s.statusBadge, background: cfg.bg, color: cfg.color }}>
          <Icon size={13} />
          {cfg.labelTH}
        </div>
      </div>

      {/* Customer */}
      <p style={s.customerName}>{order.customerName || "ลูกค้า"}</p>
      <p style={s.timeAgo}>{timeAgo(order.createdAt)}</p>

      {/* Items */}
      <div style={s.itemsList}>
        {(order.items || []).map((item, i) => (
          <div key={i} style={s.itemRow}>
            <span style={s.itemName}>
              {item.name} × {item.qty}
            </span>
            <span style={s.itemPrice}>฿{(item.price * item.qty).toFixed(0)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={s.totalRow}>
        <span style={s.totalLabel}>รวม</span>
        <span style={s.totalValue}>฿{(order.total || 0).toFixed(2)}</span>
      </div>

      {/* Action Button */}
      {cfg.next && (
        <button
          style={{ ...s.actionBtn, background: STATUS[cfg.next].color }}
          onClick={() => onUpdateStatus(order.id, cfg.next)}
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
  wrapper: {
    background: "#0a0e1a",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "'Segoe UI', sans-serif",
  },
  navbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 32px",
    borderBottom: "1px solid #1e2640",
    background: "#0d1221",
  },
  navLeft: { display: "flex", alignItems: "center", gap: 16 },
  logo: { fontSize: 20, fontWeight: 700 },
  red: { color: "#ff4d4d" },
  navTitle: {
    fontSize: 13,
    color: "#555",
    letterSpacing: 2,
    textTransform: "uppercase",
    borderLeft: "1px solid #1e2640",
    paddingLeft: 16,
  },
  navRight: { display: "flex", alignItems: "center", gap: 16 },
  mockBadge: {
    background: "#2d2009",
    color: "#f59e0b",
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 20,
    fontWeight: 600,
  },
  alertDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    background: "#ff4d4d",
    borderRadius: "50%",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #1e2640",
    color: "#888",
    padding: "7px 16px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  toast: {
    position: "fixed",
    top: 70,
    right: 24,
    background: "#ff4d4d",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    zIndex: 1000,
    boxShadow: "0 4px 20px rgba(255,77,77,0.4)",
  },
  content: { padding: "28px 32px" },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: "#131929",
    borderRadius: 14,
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statLabel: { fontSize: 12, color: "#666", margin: "0 0 4px", letterSpacing: 1 },
  statValue: { fontSize: 24, fontWeight: 800, margin: 0 },
  filterRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 700 },
  tabs: { display: "flex", gap: 8 },
  tab: {
    background: "#131929",
    border: "1px solid #1e2640",
    color: "#666",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
  tabActive: {
    background: "#ff4d4d",
    border: "1px solid #ff4d4d",
    color: "#fff",
  },
  orderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
  },
  empty: { color: "#555", fontSize: 15, padding: "40px 0", gridColumn: "1/-1" },
  orderCard: {
    background: "#131929",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: { fontSize: 14, fontWeight: 700, color: "#fff" },
  tableNo: {
    fontSize: 12,
    color: "#888",
    background: "#1e2640",
    padding: "2px 8px",
    borderRadius: 6,
    marginLeft: 8,
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 20,
  },
  customerName: { fontSize: 15, fontWeight: 600, margin: 0, color: "#ddd" },
  timeAgo: { fontSize: 12, color: "#555", margin: 0 },
  itemsList: {
    background: "#0d1221",
    borderRadius: 8,
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    margin: "4px 0",
  },
  itemRow: { display: "flex", justifyContent: "space-between" },
  itemName: { fontSize: 13, color: "#aaa" },
  itemPrice: { fontSize: 13, color: "#ccc", fontWeight: 500 },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    borderTop: "1px solid #1e2640",
  },
  totalLabel: { fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 1 },
  totalValue: { fontSize: 16, fontWeight: 800, color: "#ff4d4d" },
  actionBtn: {
    border: "none",
    color: "#fff",
    padding: "10px 0",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 1,
    marginTop: 4,
  },
};

export default AdminDashboard;