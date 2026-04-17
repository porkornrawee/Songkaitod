import { useEffect, useState, useMemo } from "react";
import { useParams,  Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import io from "socket.io-client";
import { UtensilsCrossed } from "lucide-react";
import { BASE_URL } from "../config";
import MenuHero from "../components/restaurant/MenuHero";
import SelectItem from "../components/restaurant/SelectItem";

// ===================================================
// 🍽️ Static menu fallback — แก้ตรงนี้ได้เลย
// ===================================================
const STATIC_MENU = [
  {
    _id: "1",
    name: "ไก่ทอด",
    price: 39,
    description: "เลือกผง 2 รสชาติ",
    addons: [
      { _id: "a1", name: "ชีส", price: null },
      { _id: "a2", name: "ปาปริก้า", price: null },
      { _id: "a3", name: "วิงซ์แซ่บ", price: null },
      { _id: "a4", name: "ฮอต แอนด์ สไปซี่", price: null },
      { _id: "a5", name: "ซอสมะเขือเทศ", price: null },
      { _id: "a6", name: "ซอสมายองเนส", price: null },
      { _id: "a7", name: "ดิปชีส", price: 10 },
    ],
  },
  // ✅ เพิ่มเมนูได้เรื่อยๆ ตรงนี้
];

const STATIC_RESTAURANT = {
  name: "ไก่ทอด",
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
      // ถ้าไม่มี ID ก็ใช้ static menu
      if (!id) {
        console.log("No restaurant ID, using static menu");
        return;
      }

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
    <div className="bg-black min-h-screen text-white pb-20 pt-16 font-sans">
      <MenuHero restaurant={restaurant} />
      <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8 mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white mb-2">
              {restaurant?.name || "เมนูอาหาร"}
            </h1>
            <p className="text-gray-400 text-sm">เลือกผง 2 รสชาติ</p>
          </div>
        </div>
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
