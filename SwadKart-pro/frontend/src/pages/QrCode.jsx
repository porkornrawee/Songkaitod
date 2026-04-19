import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import QRCode from "qrcode";
import qrcode from "../img/qrcode.jpg";
import { ArrowLeft, Loader } from "lucide-react";
import { BASE_URL } from "../config";
import { clearCart } from "../redux/cartSlice";

const QrCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);

  const { userInfo } = useSelector((state) => state.user);
  const { items = [], total = 0 } = location.state || {};

  const [timeLeft, setTimeLeft] = useState(300);
  const [orderId, setOrderId] = useState(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState(null);

  const createOrder = useCallback(async () => {
    // ❌ เอาเงื่อนไขบังคับ Login ออกไปแล้ว (ให้ Guest ผ่านได้)
    if (!items || items.length === 0) {
      navigate("/cart");
      return;
    }

    try {
      setOrderLoading(true);
      setOrderError(null);

      const fallbackMongoId = "60d5ecb54b4c000000000000";

      const orderPayload = {
        orderItems: items.map((item) => {
          let productId = item.product || item._id || item.id;
          if (!productId || String(productId).length !== 24) {
            productId = fallbackMongoId;
          }

          let restaurantId = item.restaurant || item.restaurantId;
          if (!restaurantId || String(restaurantId).length !== 24) {
            restaurantId = fallbackMongoId;
          }

          return {
            name: item.name || "สินค้าทดสอบ",
            qty: item.qty || 1,
            image: item.image || "https://via.placeholder.com/150",
            price: item.price || 0,
            product: productId,
            restaurant: restaurantId,
            selectedVariant: item.selectedVariant || null,
            selectedAddons: item.selectedAddons || [],
          };
        }),
        shippingAddress: {
          // ✅ ตรวจสอบว่าเป็น Guest หรือเปล่า ถ้าใช่ให้ใช้ชื่อ Guest แทน
          fullName:
            userInfo && userInfo.name ? userInfo.name : "Guest Customer",
          address: "ชำระที่ร้าน",
          city: "Bangkok",
          postalCode: "10000",
          state: "Bangkok",
          country: "Thailand",
          phone: userInfo && userInfo.phone ? userInfo.phone : "0000000000",
        },
        paymentMethod: "QR_PromptPay",
        itemsPrice: total,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: total,
        couponCode: "",
        couponDiscount: 0,
      };

      // ✅ ตั้งค่า Header (แนบ Token แค่ตอนที่มีการ Login เท่านั้น)
      const fetchHeaders = {
        "Content-Type": "application/json",
      };
      if (userInfo && userInfo.token) {
        fetchHeaders.Authorization = `Bearer ${userInfo.token}`;
      }

      const res = await fetch(`${BASE_URL}/api/v1/orders`, {
        method: "POST",
        headers: fetchHeaders,
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "สร้าง order ไม่สำเร็จ");

      setOrderId(data._id);
      dispatch(clearCart());
    } catch (err) {
      console.error("Order creation failed:", err);
      setOrderError(err.message);
    } finally {
      setOrderLoading(false);
    }
  }, [userInfo, items, total, navigate, dispatch]);

  useEffect(() => {
    createOrder();
  }, [createOrder]);

  useEffect(() => {
    if (!orderLoading && !orderError && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        `PromptPay:0812345678:${total.toFixed(2)}THB:${orderId || ""}`,
        {
          width: 200,
          margin: 2,
          color: { dark: "#111111", light: "#ffffff" },
        },
      );
    }
  }, [orderLoading, orderError, total, orderId]);

  useEffect(() => {
    if (orderLoading || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [orderLoading, timeLeft]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  if (orderLoading) {
    return (
      <div
        style={{
          ...styles.wrapper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Loader
          size={36}
          color="#ff4d4d"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <p style={{ color: "#888", fontSize: 15 }}>กำลังสร้างออเดอร์...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (orderError) {
    return (
      <div
        style={{
          ...styles.wrapper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: 40,
        }}
      >
        <p style={{ color: "#ff4d4d", fontSize: 18, fontWeight: 700 }}>
          ❌ เกิดข้อผิดพลาด
        </p>
        <p style={{ color: "#888", fontSize: 14, textAlign: "center" }}>
          {orderError}
        </p>
        <button style={styles.backBtn} onClick={() => navigate("/cart")}>
          <ArrowLeft size={15} /> กลับไปตะกร้า
        </button>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <nav style={styles.navbar}>
        <span style={styles.logo}>
          Song<span style={styles.logoRed}>kaitod</span>
          <span style={styles.logoDot}>.</span>
        </span>
      </nav>

      <div style={styles.content}>
        <style>{`.qr-amount-value { font-size: 44px !important; }`}</style>
        <p style={styles.topLabel}>การชำระเงิน · Payment</p>
        <h2 style={styles.title}>
          สแกน QR เพื่อ<span style={styles.titleRed}>ชำระเงิน</span>
        </h2>
        <p style={styles.amountNote}>นี่คือจำนวนเงินที่คุณต้องชำระ</p>

        {orderId && (
          <p style={styles.orderIdBadge}>
            Order #{orderId.slice(-6).toUpperCase()}
          </p>
        )}

        <p style={styles.amountLabel}>TOTAL AMOUNT</p>
        <p style={styles.amountValue} className="qr-amount-value">
          ฿{total.toFixed(2)}
        </p>

        <div style={styles.qrBox}>
          <img src={qrcode} alt="QR Code" />
        </div>

        <div style={styles.summaryCard}>
          <p style={styles.summaryTitle}>รายการสินค้า</p>
          {items.map((item, i) => (
            <div key={i} style={styles.summaryRow}>
              <span style={styles.summaryItem}>
                {item.name} × {item.qty || 1}
              </span>
              <span style={styles.summaryItemPrice}>
                ฿{((item.price || 0) * (item.qty || 1)).toFixed(2)}
              </span>
            </div>
          ))}
          <div style={styles.divider} />
          <div style={styles.summaryRow}>
            <span style={styles.summaryTotal}>รวมทั้งหมด</span>
            <span style={styles.summaryTotalPrice}>฿{total.toFixed(2)}</span>
          </div>
        </div>

        <p style={styles.note}>
          สแกนด้วย <span style={styles.noteHighlight}>PromptPay</span> หรือ
          Mobile Banking ใดก็ได้
        </p>

        <button style={styles.backBtn} onClick={() => navigate("/")}>
          <ArrowLeft size={15} />
          กลับไปหน้าหลัก
        </button>
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
    padding: "16px 40px",
    borderBottom: "1px solid #1e2640",
  },
  logo: { fontSize: 22, fontWeight: 700, color: "#fff" },
  logoRed: { color: "#ff4d4d" },
  logoDot: { color: "#ff4d4d" },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    textAlign: "center",
  },
  topLabel: {
    fontSize: 13,
    color: "#666",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: 800, margin: "0 0 6px" },
  titleRed: { color: "#ff4d4d" },
  amountNote: {
    fontSize: 14,
    color: "#888",
    letterSpacing: 1,
    marginBottom: 10,
  },
  orderIdBadge: {
    fontSize: 12,
    color: "#22c55e",
    background: "#0a2318",
    border: "1px solid #22c55e44",
    padding: "4px 14px",
    borderRadius: 20,
    marginBottom: 16,
    fontWeight: 600,
    letterSpacing: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: "#666",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  amountValue: {
    fontWeight: 900,
    color: "#ff4d4d",
    margin: "0 0 12px",
    lineHeight: 1,
  },
  qrBox: {
    padding: 20,
    marginBottom: 24,
    display: "inline-block",
  },
  timer: { fontSize: 13, color: "#555", marginBottom: 24 },
  timerValue: { color: "#ff9900", fontWeight: 700 },
  summaryCard: {
    background: "#131929",
    borderRadius: 14,
    padding: "18px 24px",
    textAlign: "left",
    width: "100%",
    maxWidth: 360,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 12,
    color: "#666",
    letterSpacing: 2,
    textTransform: "uppercase",
    margin: "0 0 10px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 0",
  },
  summaryItem: { fontSize: 14, color: "#ccc" },
  summaryItemPrice: { fontSize: 14, color: "#fff", fontWeight: 600 },
  divider: { borderTop: "1px solid #1e2640", margin: "8px 0" },
  summaryTotal: { fontSize: 14, color: "#fff", fontWeight: 700 },
  summaryTotalPrice: { fontSize: 14, color: "#ff4d4d", fontWeight: 800 },
  note: { fontSize: 13, color: "#555", letterSpacing: 1, marginBottom: 24 },
  noteHighlight: { color: "#ff4d4d", fontWeight: 700 },
  backBtn: {
    background: "transparent",
    border: "1px solid #2a3350",
    color: "#888",
    padding: "10px 24px",
    borderRadius: 8,
    fontSize: 13,
    letterSpacing: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
};

export default QrCodePage;
