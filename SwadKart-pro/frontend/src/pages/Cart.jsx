import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";

const Cart = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState([
    { id: 1, name: "ไก่ทอด", price: 25, qty: 1 },
    { id: 2, name: "ดิปชีส", price: 30, qty: 1 },
  ]);

  const getTotal = () =>
    items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const changeQty = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    navigate("/qrcode", {
      state: { items, total: getTotal() },
    });
  };

  const total = getTotal();

  return (
    <div style={styles.wrapper}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <span style={styles.logo}>
          Song<span style={styles.logoRed}>kaitod</span>
          <span style={styles.logoDot}>.</span>
        </span>
        <div style={styles.cartIconWrapper}>
          <ShoppingBag size={24} color="#fff" />
          <span style={styles.cartBadge}>
            {items.reduce((s, i) => s + i.qty, 0)}
          </span>
        </div>
      </nav>

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.pageTitle}>
          <ShoppingBag size={34} color="#ff4d4d" />
          <h1 style={styles.titleText}>
            YOUR <span style={styles.titleRed}>FOOD BAG</span>
          </h1>
        </div>
        <p style={styles.subtitle}>CHECK YOUR ITEMS BEFORE WE START COOKING</p>

        {/* Layout */}
        <div style={styles.layout}>
          {/* Left - Items */}
          <div style={styles.itemsCol}>
            {items.length === 0 ? (
              <div style={styles.emptyMsg}>ตะกร้าว่างเปล่า 🛒</div>
            ) : (
              items.map((item) => (
                <div key={item.id} style={styles.cartItem}>
                  <div style={styles.itemImg}>{item.name}</div>
                  <div style={styles.itemInfo}>
                    <p style={styles.itemName}>{item.name}</p>
                    <p style={styles.itemPrice}>฿{item.price}</p>
                  </div>
                  <div style={styles.qtyControls}>
                    <button style={styles.qtyBtn} onClick={() => changeQty(item.id, -1)}>
                      −
                    </button>
                    <span style={styles.qtyVal}>{item.qty}</span>
                    <button style={styles.qtyBtn} onClick={() => changeQty(item.id, 1)}>
                      +
                    </button>
                  </div>
                  <button style={styles.deleteBtn} onClick={() => removeItem(item.id)}>
                    <Trash2 size={17} color="#ff4d4d" />
                  </button>
                </div>
              ))
            )}

            <div style={styles.continueLink} onClick={() => navigate("/")}>
              <ArrowLeft size={13} color="#666" />
              <span style={styles.continueTxt}>CONTINUE SHOPPING</span>
            </div>
          </div>

          {/* Right - Bill */}
          <div style={styles.billCard}>
            <p style={styles.billTitle}>BILL DETAILS</p>
            <div style={styles.billRow}>
              <span style={styles.billLabel}>SUBTOTAL</span>
              <span style={styles.billValue}>฿{total.toFixed(2)}</span>
            </div>
            <div style={styles.billTotalRow}>
              <span style={styles.billLabel}>TO PAY</span>
              <span style={styles.billTotalAmount}>฿{total.toFixed(2)}</span>
            </div>
            <button style={styles.checkoutBtn} onClick={handleCheckout}>
              CHECKOUT NOW
              <ArrowRight size={18} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
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
    padding: "16px 40px",
    borderBottom: "1px solid #1e2640",
  },
  logo: { fontSize: 22, fontWeight: 700, color: "#fff" },
  logoRed: { color: "#ff4d4d" },
  logoDot: { color: "#ff4d4d" },
  cartIconWrapper: { position: "relative", cursor: "pointer" },
  cartBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    background: "#ff4d4d",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: "50%",
    width: 18,
    height: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: "28px 40px" },
  pageTitle: { display: "flex", alignItems: "center", gap: 12, marginBottom: 6 },
  titleText: { fontSize: 32, fontWeight: 800, margin: 0 },
  titleRed: { color: "#ff4d4d", fontStyle: "italic" },
  subtitle: {
    fontSize: 12,
    letterSpacing: 3,
    color: "#666",
    marginBottom: 32,
    textTransform: "uppercase",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 24,
    alignItems: "start",
  },
  itemsCol: { display: "flex", flexDirection: "column", gap: 16 },
  emptyMsg: { color: "#555", fontSize: 16, padding: "40px 0" },
  cartItem: {
    background: "#131929",
    borderRadius: 16,
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  itemImg: {
    width: 90,
    height: 90,
    background: "#1e2640",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    color: "#666",
    flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 18, fontWeight: 600, margin: "0 0 4px" },
  itemPrice: { fontSize: 18, fontWeight: 700, color: "#ff4d4d", margin: 0 },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    background: "#1e2640",
    borderRadius: 8,
    overflow: "hidden",
  },
  qtyBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 18,
    width: 36,
    height: 36,
    cursor: "pointer",
  },
  qtyVal: { width: 40, textAlign: "center", fontSize: 15, fontWeight: 600 },
  deleteBtn: {
    background: "#2a1520",
    border: "none",
    borderRadius: 8,
    width: 40,
    height: 40,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  continueLink: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    marginTop: 4,
  },
  continueTxt: { fontSize: 12, letterSpacing: 2, color: "#666" },
  billCard: {
    background: "#131929",
    borderRadius: 20,
    padding: 28,
  },
  billTitle: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: 1,
    marginBottom: 20,
    margin: "0 0 20px",
  },
  billRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #1e2640",
  },
  billLabel: { fontSize: 13, color: "#aaa", letterSpacing: 1, textTransform: "uppercase" },
  billValue: { fontSize: 14, color: "#fff", fontWeight: 600 },
  billTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0 20px",
  },
  billTotalAmount: { fontSize: 32, fontWeight: 800, color: "#ff4d4d" },
  checkoutBtn: {
    width: "100%",
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "16px",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
};

export default Cart;