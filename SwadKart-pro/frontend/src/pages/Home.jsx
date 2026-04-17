import React, { useEffect, useState, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Star, Clock, Loader2, UtensilsCrossed } from "lucide-react";
import { BASE_URL } from "../config";

const FALLBACK_RESTAURANT_ID = "69cb2f9b5be503cfcb84adcd";

// ===================================================
// 🍽️ ใส่เมนูร้านตรงนี้ได้เลย ไม่ต้องพึ่ง database
// ===================================================
const STATIC_MENU = [
  {
    _id: "1",
    name: "ไก่ทอด",
    price: 25,
    description: "เลือกผงได้ 2 รสชาติ",
    category: "ไก่ทอด",
    image: "",
    isVeg: true,
    inStock: true,
  },
  {
    _id: "2",
    name: "ดิปชีส",
    price: 30,
    description: "ไก่ทอด + ดิปชีส",
    category: "ไก่ทอด",
    image: "",
    isVeg: true,
    inStock: true,
  },
  {
    _id: "3",
    name: "ดิปซาวครีม",
    price: 30,
    description: "ไก่ทอด + ดิปซาวครีม",
    category: "ไก่ทอด",
    image: "",
    isVeg: true,
    inStock: true,
  },
  {
    _id: "4",
    name: "เซต 777",
    price: 35,
    description: "ไก่ทอด + ดิป 1 รสชาติ",
    category: "ไก่ทอด",
    image: "",
    isVeg: true,
    inStock: true,
  },
  {
    _id: "5",
    name: "เซต 888",
    price: 45,
    description: "ไก่ทอด + ดิป 2 รสชาติ",
    category: "ไก่ทอด",
    image: "",
    isVeg: true,
    inStock: true,
  },
  {
    _id: "6",
    name: "เซต 999",
    price: 55,
    description: "ไก่ทอด + ดิป 2 รสชาติ + ชีส",
    category: "ไก่ทอด",
    image: "",
    isVeg: true,
    inStock: true,
  },
  // ✅ เพิ่มเมนูได้เรื่อยๆ ตรงนี้เลย
];

const RESTAURANT_INFO = {
  name: "ซ่องไก่ทอด",
  isOpenNow: true,
  rating: 4.5,
};

const Home = () => {
  const { restaurantId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get("restaurantId");
  const restaurantId = paramId || queryId || FALLBACK_RESTAURANT_ID;

  const [menuItems, setMenuItems] = useState(STATIC_MENU);
  const [restaurantInfo] = useState(RESTAURANT_INFO);
  const [loading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/v1/products/restaurant/${restaurantId}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMenuItems(data);
        }
      } catch {
        console.log("ใช้ static menu แทน");
      }
    };

    fetchMenu();

    import("socket.io-client").then(({ default: io }) => {
      const socket = io(BASE_URL);
      socketRef.current = socket;
      socket.on("menuUpdated", fetchMenu);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [restaurantId]);

  const categories = [
    "All",
    ...Array.from(
      new Set(menuItems.map((item) => item.category).filter(Boolean)),
    ),
  ];

  const filtered =
    activeCategory === "All"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  const inStock = filtered.filter((item) => item.inStock !== false);

  return (
    <div className="bg-black min-h-screen text-white pt-20">
      {/* RESTAURANT HEADER */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-4xl">🍽️</span>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">
              {restaurantInfo?.name || "เมนูอาหาร"}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {restaurantInfo?.isOpenNow ? "เปิดให้บริการ" : "ปิดให้บริการ"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS */}
      {categories.length > 1 && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-gray-900 text-gray-400 border border-gray-800 hover:border-primary/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MENU GRID */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary h-12 w-12" />
          </div>
        ) : inStock.length === 0 ? (
          <div className="text-center py-20 bg-gray-900 rounded-2xl">
            <UtensilsCrossed size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-xl">ไม่มีเมนูในหมวดนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inStock.map((item) => (
              <Link
                to={`/restaurant/${item._id}`}
                key={item._id}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/10 group block"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      item.image ||
                      "https://placehold.co/400x300/1a1a2e/ffffff?text=อาหาร"
                    }
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className={`absolute top-3 left-3 w-5 h-5 rounded-sm border-2 flex items-center justify-center ${item.isVeg ? "border-green-500 bg-black" : "border-red-500 bg-black"}`}
                  >
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`}
                    />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors text-white">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-primary font-extrabold text-xl">
                      ฿{item.price}
                    </span>
                    <span className="bg-primary hover:bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full transition-all">
                      + เพิ่ม
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* QR CODE BUTTON */}
      <Link
        to={`/qrcode/${restaurantId}`}
        className="fixed bottom-8 right-8 z-[9999] flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-primary hover:bg-primary transition-all group"
      >
        <div className="bg-primary group-hover:bg-white p-2 rounded-lg transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            className="group-hover:stroke-primary"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect width="7" height="7" x="7" y="7" rx="1" />
          </svg>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-70">Test Link</span>
          <span className="font-bold text-lg">ไปหน้า QR Code</span>
        </div>
      </Link>
    </div>
  );
};

export default Home;
