import { useEffect, useState, useMemo } from "react";
import { useParams,  Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import io from "socket.io-client";
import { UtensilsCrossed } from "lucide-react";
import { BASE_URL } from "../config";

// ===================================================
// 🍽️ Static menu fallback — แก้ตรงนี้ได้เลย
// ===================================================
const STATIC_MENU = [
  {
    _id: "1",
    name: "ไก่ทอด",
    price: 25,
    description: "เลือกผงได้ 2 รสชาติ",
    addons: [
      { _id: "a1", name: "ชีส", price: 10 },
      { _id: "a2", name: "บาร์บิคิว", price: 10 },
      { _id: "a3", name: "ข้าวโพด", price: 10 },
    ],
  },
  {
    _id: "2",
    name: "ดิปชีส",
    price: 30,
    description: "ไก่ทอด + ดิปชีส",
    addons: [],
  },
  {
    _id: "3",
    name: "ดิปซาวครีม",
    price: 30,
    description: "ไก่ทอด + ดิปซาวครีม",
    addons: [],
  },
  {
    _id: "4",
    name: "เซต 777",
    price: 35,
    description: "ไก่ทอด + ดิป 1 รสชาติ",
    addons: [
      { _id: "a1", name: "ชีส", price: 10 },
      { _id: "a2", name: "บาร์บิคิว", price: 10 },
      { _id: "a3", name: "ข้าวโพด", price: 10 },
    ],
  },
  {
    _id: "5",
    name: "เซต 888",
    price: 45,
    description: "ไก่ทอด + ดิป 2 รสชาติ",
    addons: [
      { _id: "a1", name: "ชีส", price: 10 },
      { _id: "a2", name: "บาร์บิคิว", price: 10 },
      { _id: "a3", name: "ข้าวโพด", price: 10 },
    ],
  },
  {
    _id: "6",
    name: "เซต 999",
    price: 55,
    description: "ไก่ทอด + ดิป 2 รสชาติ + ชีส",
    addons: [
      { _id: "a1", name: "ชีส", price: 10 },
      { _id: "a2", name: "บาร์บิคิว", price: 10 },
      { _id: "a3", name: "ข้าวโพด", price: 10 },
    ],
  },
  // ✅ เพิ่มเมนูได้เรื่อยๆ ตรงนี้
];

const STATIC_RESTAURANT = {
  name: "ซ่องไก่ทอด",
  isOpenNow: true,
  rating: 4.5,
  image: "",
};

const RestaurantMenu = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const currentProduct = STATIC_MENU.find((item) => item._id === id);

  const [restaurant, setRestaurant] = useState(STATIC_RESTAURANT);
  const [menu, setMenu] = useState(STATIC_MENU);
  const [searchTerm] = useState("");
  const [loading] = useState(false);
  const [isVegOnly] = useState(false);

  // ลอง fetch จาก API ถ้าได้ก็ใช้ ถ้าไม่ได้ก็ใช้ static
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRes, menuRes] = await Promise.all([
          fetch(`${BASE_URL}/api/v1/users/${id}`),
          fetch(`${BASE_URL}/api/v1/products/restaurant/${id}`),
        ]);
        const resData = await resRes.json();
        const menuData = await menuRes.json();

        const fetchedRestaurant = resData.data || resData;
        if (fetchedRestaurant?.name) setRestaurant(fetchedRestaurant);

        const fetchedMenu = Array.isArray(menuData)
          ? menuData
          : menuData.products || [];
        if (fetchedMenu.length > 0) setMenu(fetchedMenu);
      } catch {
        // ใช้ static menu แทน ไม่ต้องแสดง error
        console.log("ใช้ static menu แทน");
      }
    };
    fetchData();
  }, [id]);

  // Socket
  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on("productUpdated", (updated) => {
      setMenu((prev) =>
        prev.map((it) => (it._id === updated._id ? { ...it, ...updated } : it)),
      );
    });
    return () => socket.disconnect();
  }, []);

  const categorizedMenu = useMemo(() => {
    let filtered = menu.filter(
      (it) =>
        it.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (!isVegOnly || it.isVeg),
    );
    const groups = {};
    filtered.forEach((it) => {
      const cat = it.category || "Main Menu";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(it);
    });
    return groups;
  }, [menu, searchTerm, isVegOnly]);

  if (!currentProduct) {
    return <div className="text-white text-center mt-20">ไม่พบเมนูนี้</div>;
  }

  if (loading) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-extrabold italic tracking-widest text-xs uppercase">
          Loading Menu...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white pb-20 pt-24 font-sans">
      <MenuHero restaurant={restaurant} />
      <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8 mt-8">
        <Link
          to="/"
          className="text-gray-400 hover:text-white mb-6 inline-block font-bold"
        >
          &larr; กลับไปหน้ารวมเมนู
        </Link>

        <div className="flex justify-between items-center mb-2">
          <div className="text-4xl font-extrabold text-white mb-0">
            {currentProduct.name}
          </div>
          <div className="text-3xl font-extrabold text-primary">
            ฿{currentProduct.price}
          </div>
        </div>

        <p className="text-gray-400 text-lg mb-2">
          {currentProduct.description || "ไม่มีคำอธิบายเพิ่มเติม"}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {Object.keys(categorizedMenu).length === 0 ? (
          <div className="text-center py-24 bg-gray-900 rounded-2xl border-2 border-dashed border-gray-800 shadow-xl">
            <UtensilsCrossed size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500 text-lg font-extrabold uppercase italic tracking-widest">
              No dishes match your craving
            </p>
          </div>
        ) : (
          Object.entries(categorizedMenu).map(([category, items]) => (
            <section key={category} className="mb-16">
              <div className="grid grid-cols-1 gap-8">
                {items.map((item) => (
                  <SelectItem key={item._id} item={item} dispatch={dispatch} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default RestaurantMenu;
