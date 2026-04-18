import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ShoppingBag, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { removeFromCart, updateQty } from "../redux/cartSlice";
import Navbar from "../components/Navbar";
import kaitod from "../img/kaitod.jpg";

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);

  const getTotal = () =>
    cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);

  const changeQty = (cartUniqueId, delta) => {
    const item = cartItems.find((x) => x.cartUniqueId === cartUniqueId);
    if (item) {
      dispatch(updateQty({ cartUniqueId, qty: item.qty + delta }));
    }
  };

  const removeItem = (cartUniqueId) => {
    dispatch(removeFromCart(cartUniqueId));
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate("/qrcode", {
      state: { items: cartItems, total: getTotal() },
    });
  };

  const total = getTotal();

  return (
    <div className="bg-black min-h-screen text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <ShoppingBag size={40} className="text-primary" />
          <div>
            <h1 className="text-4xl font-extrabold">
              YOUR <span className="text-primary italic">KAITOD</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 tracking-widest uppercase">
              CHECK YOUR ITEMS BEFORE WE START COOKING
            </p>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left - Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-xl">
                <p className="text-gray-400">ตะกร้าว่างเปล่า 🛒</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.cartUniqueId} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 hover:border-primary/50 transition-all">
                  <div className="w-20 h-20 bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-600">
                    <img src={kaitod} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{item.name}</p>
                    <p className="text-primary font-bold">฿{item.price}</p>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        + {item.selectedAddons.map((a) => a.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
                    <button
                      className="px-3 py-2 text-white hover:bg-gray-700"
                      onClick={() => changeQty(item.cartUniqueId, -1)}
                    >
                      −
                    </button>
                    <span className="px-2 py-2 font-semibold">{item.qty || 1}</span>
                    <button
                      className="px-3 py-2 text-white hover:bg-gray-700"
                      onClick={() => changeQty(item.cartUniqueId, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="p-2 text-primary hover:bg-gray-800 rounded-lg transition-colors"
                    onClick={() => removeItem(item.cartUniqueId)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}

            <div
              className="flex items-center gap-2 mt-6 cursor-pointer text-gray-400 hover:text-primary transition-colors"
              onClick={() => navigate("/")}
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-semibold uppercase tracking-wide">CONTINUE SHOPPING</span>
            </div>
          </div>

          {/* Right - Bill */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit sticky top-28">
            <p className="text-lg font-extrabold uppercase tracking-wide mb-6">BILL DETAILS</p>
            <div className="space-y-3 mb-6 border-b border-gray-800 pb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 uppercase tracking-wider">SUBTOTAL</span>
                <span className="font-bold">฿{total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 uppercase tracking-wider">TO PAY</span>
                <span className="text-3xl font-extrabold text-primary">฿{total.toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-primary text-white rounded-lg py-3 font-bold uppercase tracking-wider hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
              CHECKOUT NOW
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;