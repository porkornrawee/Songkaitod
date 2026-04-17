import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const QrCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  const { items = [], total = 0 } = location.state || {};

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  return (
    <div style={styles.wrapper}>
      {/* Navbar */}
      <nav style={styles.navbar}>
        <span style={styles.logo}>
          Song<span style={styles.logoRed}>kaitod</span>
          <span style={styles.logoDot}>.</span>
        </span>
      </nav>

      <div style={styles.content}>
        <p style={styles.topLabel}>การชำระเงิน · Payment</p>
        <h2 style={styles.title}>
          สแกน QR เพื่อ<span style={styles.titleRed}>ชำระเงิน</span>
        </h2>
        <p style={styles.amountNote}>นี่คือจำนวนเงินที่คุณต้องชำระ</p>

        <p style={styles.amountLabel}>TOTAL AMOUNT</p>
        <p style={styles.amountValue}>฿{total.toFixed(2)}</p>

        <div style={styles.qrBox}>
          <img
            src="./img/qrcode.jpg"
            alt="QR Code"
            style={{ width: 200, height: 200, display: "block" }}
          />
        </div>

        {/* Order Summary */}
        <div style={styles.summaryCard}>
          <p style={styles.summaryTitle}>รายการสินค้า</p>
          {items.map((item) => (
            <div key={item.id} style={styles.summaryRow}>
              <span style={styles.summaryItem}>
                {item.name} × {item.qty}
              </span>
              <span style={styles.summaryItemPrice}>
                ฿{(item.price * item.qty).toFixed(2)}
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
          สแกนด้วย <span style={styles.noteHighlight}>PromptPay</span>{" "}
          หรือ Mobile Banking ใดก็ได้
        </p>

        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={15} />
          กลับไปแก้ไขตะกร้า
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
  amountNote: { fontSize: 14, color: "#888", letterSpacing: 1, marginBottom: 18 },
  amountLabel: {
    fontSize: 12,
    color: "#666",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 52,
    fontWeight: 900,
    color: "#ff4d4d",
    margin: "0 0 24px",
    lineHeight: 1,
  },
  qrBox: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
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