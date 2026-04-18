import React, { useState, useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { addToCart } from "../../redux/cartSlice";
import { toast } from "react-hot-toast";

const SelectItem = ({ item, dispatch }) => {
  const [selectedAddons, setSelectedAddons] = useState([]);

  // คำนวณราคาสุทธิ: ราคาปกติ + ราคา Addons ที่เลือก
  const finalPrice = useMemo(() => {
    let basePrice = Number(item.price);
    let addonsPrice = selectedAddons.reduce(
      (acc, a) => acc + Number(a.price),
      0,
    );
    return basePrice + addonsPrice;
  }, [selectedAddons, item.price]);

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        ...item,
        price: finalPrice,
        selectedAddons,
        qty: 1,
      }),
    );
    toast.success(`${item.name} added! 🛒`);
  };

  const handleAddonToggle = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((sa) => sa._id === addon._id);
      if (exists) {
        return prev.filter((sa) => sa._id !== addon._id);
      } else {
        return [...prev, addon];
      }
    });
  };

  return (
    <div className="bg-black rounded-2xl overflow-hidden group flex flex-col shadow-2xl relative hover:border-primary/40 transition-all duration-300">
      <div className="p-6 flex flex-col flex-1 bg-black">
        {/* Add Extras (Addons) */}
        {item.addons?.length > 0 && (
          <div className="mb-2">
            <p className="text-lg font-extrabold text-gray-500 uppercase tracking-[0.1em] mb-3">
              เลือกผง 2 รสชาติ:
            </p>
            <ul className="space-y-3">
              {item.addons.map((a) => (
                <li
                  key={a._id}
                  className="flex items-center justify-between text-base"
                >
                  <label className="flex items-center gap-3 text-gray-300 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={selectedAddons.some((sa) => sa._id === a._id)}
                      onChange={() => handleAddonToggle(a)}
                      className="accent-primary w-6 h-6 rounded cursor-pointer"
                    />
                    <span className="font-bold">{a.name}</span>
                  </label>
                  <span className="text-gray-400 italic text-lg whitespace-nowrap">
                    +฿{a.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleAddToCart}
        disabled={item.countInStock === 0}
        className={`mt-auto w-full font-extrabold py-4 rounded-xl transition-all uppercase text-sm tracking-[0.2em] flex items-center justify-between px-6 ${
          item.countInStock === 0
            ? "bg-gray-800 text-gray-600 cursor-not-allowed"
            : "bg-white text-black hover:bg-primary hover:text-white shadow-lg active:scale-[0.98]"
        }`}
      >
        {item.countInStock === 0 ? (
          <span className="w-full text-center text-base">Unavailable</span>
        ) : (
          <>
            <span className="flex items-center gap-2">
              Add to Cart <ShoppingBag size={20} />
            </span>
            <span className="bg-black/10 px-3 py-1.5 rounded-lg text-base">
              ฿{finalPrice}
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default SelectItem;
