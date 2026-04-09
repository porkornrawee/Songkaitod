import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import io from "socket.io-client";
import {
  Plus,
  UtensilsCrossed,
  X,
  Check,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { BASE_URL } from "../config";
import { toast } from "react-hot-toast";

import MenuHero from "../components/restaurant/MenuHero";
import SelectItem from "../components/restaurant/SelectItem";

// ===================================================
// 🍽️ Static menu fallback — แก้ตรงนี้ได้เลย
// ===================================================
const STATIC_MENU = [
  {
    _id: "1",
    name: "กะหรี่ไก่",
    price: 35,
    description: "ไก่ทอดจากกะหรี่ หอมกรอบ",
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
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.user);

  const [restaurant, setRestaurant] = useState(STATIC_RESTAURANT);
  const [menu, setMenu] = useState(STATIC_MENU);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVegOnly, setIsVegOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [finalPrice, setFinalPrice] = useState(0);

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

  useEffect(() => {
    if (!selectedItem) return;
    let price = selectedVariant
      ? Number(selectedVariant.price)
      : Number(selectedItem.price);
    const addonsPrice = selectedAddons.reduce(
      (acc, a) => acc + Number(a.price),
      0,
    );
    setFinalPrice(price + addonsPrice);
  }, [selectedVariant, selectedAddons, selectedItem]);

  const handleAddToCartClick = (item) => {
    if (item.countInStock === 0) return;
    if (item.variants?.length > 0 || item.addons?.length > 0) {
      setSelectedItem(item);
      setSelectedVariant(item.variants?.[0] || null);
      setSelectedAddons([]);
      setShowModal(true);
    } else {
      dispatch(addToCart({ ...item, qty: 1 }));
      toast.success(`${item.name} added!`);
    }
  };

  const confirmCustomization = () => {
    dispatch(
      addToCart({
        ...selectedItem,
        price: finalPrice,
        selectedVariant,
        selectedAddons,
        qty: 1,
      }),
    );
    setShowModal(false);
    toast.success("Customized dish added! 🛒");
  };

  if (loading)
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-extrabold italic tracking-widest text-xs uppercase">
          Loading Menu...
        </p>
      </div>
    );

  return (
    <div className="bg-black min-h-screen text-white pb-20 pt-24 font-sans">
      <MenuHero restaurant={restaurant} />
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
