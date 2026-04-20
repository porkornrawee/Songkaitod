import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Bell,
  BellOff,
  LayoutDashboard,
  Utensils,
} from "lucide-react";
import { BASE_URL } from "../config";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

// Modular Components
import AnalyticsSection from "../components/restaurant/AnalyticsSection";
import LiveOrders from "../components/restaurant/LiveOrders";
import MenuManagement from "../components/restaurant/MenuManagement";
import ItemModal from "../components/restaurant/ItemModal";

const RestaurantOwnerDashboard = () => {
  const { userInfo } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, pending: 0, delivered: 0 });
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [newOrderPopup, setNewOrderPopup] = useState(null);

  // Menu Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Partner Selection State
  const [selectedPartner, setSelectedPartner] = useState({});

  const [newItem, setNewItem] = useState({
    name: "", price: "", description: "", category: "", image: "", isVeg: "true", variants: [], addons: [],
  });

  const audioPlayer = useRef(null);
  const socketRef = useRef(null);
  
  // ใช้ Ref เพื่อให้ฟังก์ชันใน Socket เข้าถึงค่าเสียงล่าสุดได้ โดยไม่ต้อง Re-render Socket
  const soundEnabledRef = useRef(isSoundEnabled);
  useEffect(() => {
    soundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // 🛡️ Security Check
  useEffect(() => {
    if (userInfo && userInfo.role !== "restaurant_owner") {
      toast.error("Access Denied: Restaurant Owners Only");
      navigate("/");
    }
  }, [userInfo, navigate]);

  const getFetchOptions = (method = "GET", body = null) => ({
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userInfo?.token}`,
    },
    body: body ? JSON.stringify(body) : null,
  });

  const fetchData = async () => {
    if (!userInfo) return;
    try {
      const safeJson = async (promise) => {
        try {
          const res = await promise;
          if (!res.ok) return [];
          return res.json();
        } catch  { return []; }
      };

      const [dOrders, dMenu, dPartners, dGraph] = await Promise.all([
        safeJson(fetch(`${BASE_URL}/api/v1/orders/restaurant-orders`, getFetchOptions())),
        safeJson(fetch(`${BASE_URL}/api/v1/products/restaurant/${userInfo._id}`, getFetchOptions())),
        safeJson(fetch(`${BASE_URL}/api/v1/users/delivery-partners`, getFetchOptions())),
        safeJson(fetch(`${BASE_URL}/api/v1/orders/sales-stats`, getFetchOptions())),
      ]);

      const safeOrders = Array.isArray(dOrders) ? dOrders : [];
      setOrders(safeOrders);
      setMenuItems(Array.isArray(dMenu) ? dMenu : []);
      setDeliveryPartners(Array.isArray(dPartners) ? dPartners : []);

      setGraphData(
        (Array.isArray(dGraph) ? dGraph : []).map((i) => ({
          day: new Date(i._id).toLocaleDateString("en-US", { weekday: "short" }),
          sales: i.sales,
        }))
      );

      setStats({
        revenue: safeOrders.reduce((acc, o) => acc + (o.isPaid ? o.totalPrice : 0), 0),
        pending: safeOrders.filter(
          (o) => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled"
        ).length,
        delivered: safeOrders.filter((o) => o.orderStatus === "Delivered").length,
      });
    } catch  {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔌 Socket Connection Logic (ทำงานรอบเดียว ไม่ตัดสายตอนกดปุ่มเสียง)
  useEffect(() => {
    fetchData();
    if (!userInfo) return;

    socketRef.current = io(BASE_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("🟢 Restaurant Owner Socket Connected:", socketRef.current.id);
      socketRef.current.emit("joinOrder", userInfo._id);
    });

    socketRef.current.on("newOrderReceived", (newOrder) => {
      // เช็คการเปิดเสียงผ่าน Ref
      if (soundEnabledRef.current && audioPlayer.current) {
        audioPlayer.current.play().catch((e) => console.log("Audio play failed", e));
      }

      setNewOrderPopup(newOrder);
      toast.success(`🔔 NEW ORDER! #${newOrder._id.slice(-6)}`, {
        duration: 6000,
        icon: "🍕",
        style: { borderRadius: "12px", background: "#111827", color: "#fff", border: "1px solid #ef4444" },
      });
      fetchData();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [userInfo]); 

  const handleToggleStock = async (id) => {
    const res = await fetch(`${BASE_URL}/api/v1/products/${id}/toggle-stock`, getFetchOptions("PATCH"));
    if (res.ok) { fetchData(); toast.success("Stock status updated"); }
  };

  const handleAssignPartner = async (orderId) => {
    const pId = selectedPartner[orderId];
    if (!pId) return toast.error("Please select a partner");
    try {
      const res = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/assign`, getFetchOptions("PUT", { deliveryPartnerId: pId }));
      if (res.ok) { fetchData(); toast.success("Pilot Assigned 🛵"); } 
      else { toast.error("Assignment failed"); }
    } catch { toast.error("Network error"); }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    const res = await fetch(`${BASE_URL}/api/v1/orders/${orderId}/status`, getFetchOptions("PUT", { status: newStatus }));
    if (res.ok) { toast.success(`Order set to ${newStatus}`); fetchData(); }
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${BASE_URL}/api/v1/products/${editId}` : `${BASE_URL}/api/v1/products`;

    const payload = {
      ...newItem, price: Number(newItem.price), isVeg: newItem.isVeg === "true", restaurantId: userInfo._id,
      variants: (newItem.variants || []).map((v) => ({ ...v, price: Number(v.price) })),
      addons: (newItem.addons || []).map((a) => ({ ...a, price: Number(a.price) })),
    };

    const res = await fetch(url, getFetchOptions(method, payload));
    if (res.ok) { setShowModal(false); fetchData(); toast.success("Kitchen Menu Updated!"); } 
    else { toast.error("Update failed"); }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8 font-sans">
      <audio ref={audioPlayer} src="/notification.mp3" preload="auto" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold italic uppercase tracking-tighter flex items-center gap-4">
              <span className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/25 rotate-2">🍳</span>
              Kitchen <span className="text-primary">Control</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.5em] mt-3 pl-2">
              Manage your orders & culinary lab
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-6 py-3 rounded-xl shadow-lg">
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`flex items-center gap-2 transition-colors ${isSoundEnabled ? "text-green-500" : "text-gray-500"}`}
            >
              {isSoundEnabled ? <Bell size={18} /> : <BellOff size={18} />}
              <span className="text-[11px] font-extrabold uppercase tracking-widest">
                {isSoundEnabled ? "Alerts On" : "Muted"}
              </span>
            </button>
          </div>
        </header>

        <div className="flex bg-gray-900/50 p-1.5 rounded-2xl mb-12 border border-gray-800 shadow-inner max-w-md">
          {[{ id: "overview", label: "Analytics", icon: LayoutDashboard }, { id: "menu", label: "Menu Lab", icon: Utensils }].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-extrabold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 ${
                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-primary h-12 w-12" />
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-6 animate-pulse">Heating up the stoves...</p>
          </div>
        ) : activeTab === "overview" ? (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12">
            <AnalyticsSection stats={stats} graphData={graphData} />
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
              <LiveOrders
                orders={orders} deliveryPartners={deliveryPartners} selectedPartner={selectedPartner}
                setSelectedPartner={setSelectedPartner} handleAssignPartner={handleAssignPartner} handleStatusUpdate={handleStatusUpdate}
              />
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <MenuManagement
              menuItems={menuItems} handleToggleStock={handleToggleStock}
              handleDeleteItem={async (id) => {
                if (window.confirm("Permanent removal from menu?")) {
                  await fetch(`${BASE_URL}/api/v1/products/${id}`, getFetchOptions("DELETE"));
                  fetchData(); toast.success("Item removed");
                }
              }}
              openAddModal={() => {
                setIsEditing(false); setNewItem({ name: "", price: "", description: "", category: "", image: "", isVeg: "true", variants: [], addons: [] });
                setShowModal(true);
              }}
              openEditModal={(item) => {
                setIsEditing(true); setEditId(item._id);
                setNewItem({ ...item, isVeg: item.isVeg ? "true" : "false", variants: item.variants || [], addons: item.addons || [] });
                setShowModal(true);
              }}
            />
          </div>
        )}
      </div>

      {newOrderPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border-2 border-primary rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl shadow-primary/30">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl animate-pulse">🔔</span>
              <div>
                <p className="text-[10px] text-primary font-extrabold uppercase tracking-widest">New Order Arrived!</p>
                <p className="text-white font-extrabold text-xl">#{newOrderPopup._id?.slice(-6)}</p>
              </div>
            </div>

            <div className="bg-black/50 rounded-2xl p-4 mb-6 space-y-2 max-h-48 overflow-y-auto">
              {newOrderPopup.orderItems?.length > 0 ? (
                newOrderPopup.orderItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.qty}x {item.name}</span>
                    <span className="text-white font-bold">฿{item.price}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">No items info</p>
              )}
            </div>

            <div className="flex justify-between items-center mb-6 border-t border-gray-700 pt-4">
              <span className="text-gray-400 text-sm font-bold uppercase tracking-widest">Total</span>
              <span className="text-primary font-extrabold text-2xl">฿{newOrderPopup.totalPrice}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setNewOrderPopup(null); setActiveTab("overview"); }} className="flex-1 bg-primary hover:bg-primary/80 text-white font-extrabold py-3 rounded-xl uppercase tracking-widest text-[11px] transition-all">
                ✅ Accept
              </button>
              <button onClick={() => setNewOrderPopup(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 font-extrabold py-3 rounded-xl uppercase tracking-widest text-[11px] transition-all">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <ItemModal showModal={showModal} setShowModal={setShowModal} isEditing={isEditing} newItem={newItem} setNewItem={setNewItem} handleSubmitItem={handleSubmitItem} />
    </div>
  );
};

export default RestaurantOwnerDashboard;