import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/userSlice";
import {
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  ChefHat,
  Truck,
  Package,
  Menu,
  X,
} from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { cartItems } = useSelector((state) => state.cart);
  const { userInfo } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = () => {
    dispatch(logout());
    setIsOpen(false);
    navigate("/");
  };

  const closeMenu = () => setIsOpen(false);

  const totalQty = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <nav className="bg-gray-950 text-white border-b border-gray-800 fixed w-full z-50 top-0 pt-8 md:pt-0 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* LOGO */}
          <Link
            to="/"
            className="text-2xl font-extrabold text-primary tracking-tight flex items-center"
            onClick={closeMenu}
          >
            Swad<span className="text-white">Kart</span>
            <span className="w-2.5 h-2.5 rounded-full bg-primary mt-4 animate-bounce"></span>
          </Link>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">

            {/* ถ้า login อยู่ (staff/owner) แสดง dashboard link */}
            {userInfo && (
              <div className="hidden md:flex items-center gap-4">
                {userInfo.role === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-bold text-sm"
                  >
                    <LayoutDashboard size={16} /> Admin
                  </Link>
                )}
                {userInfo.role === "restaurant_owner" && (
                  <Link
                    to="/restaurant/dashboard"
                    className="flex items-center gap-1 text-green-400 hover:text-green-300 font-bold text-sm"
                  >
                    <ChefHat size={16} /> Kitchen
                  </Link>
                )}
                {userInfo.role === "delivery_partner" && (
                  <Link
                    to="/delivery/dashboard"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold text-sm"
                  >
                    <Truck size={16} /> Delivery
                  </Link>
                )}
                {userInfo.role === "user" && (
                  <Link
                    to="/myorders"
                    className="flex items-center gap-1 text-gray-300 hover:text-primary font-bold text-sm"
                  >
                    <Package size={16} /> My Orders
                  </Link>
                )}
                <button
                  onClick={logoutHandler}
                  className="text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative" aria-label="ตะกร้า">
              <ShoppingCart size={24} className="text-gray-300 hover:text-primary transition-colors" />
              {totalQty > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {totalQty}
                </span>
              )}
            </Link>

            {/* Hamburger (มือถือ) — แสดงเฉพาะถ้า login อยู่ */}
            {userInfo && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden text-gray-300 hover:text-white focus:outline-none"
                aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
              >
                {isOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN — แสดงเฉพาะ staff ที่ login อยู่ */}
      {isOpen && userInfo && (
        <div className="md:hidden bg-gray-900 border-b border-gray-800 shadow-2xl">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {userInfo.role === "admin" && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 px-3 py-3 rounded-md font-bold text-yellow-400 hover:bg-gray-800"
                onClick={closeMenu}
              >
                <LayoutDashboard size={18} /> Admin Panel
              </Link>
            )}
            {userInfo.role === "restaurant_owner" && (
              <Link
                to="/restaurant/dashboard"
                className="flex items-center gap-2 px-3 py-3 rounded-md font-bold text-green-400 hover:bg-gray-800"
                onClick={closeMenu}
              >
                <ChefHat size={18} /> Kitchen Dashboard
              </Link>
            )}
            {userInfo.role === "delivery_partner" && (
              <Link
                to="/delivery/dashboard"
                className="flex items-center gap-2 px-3 py-3 rounded-md font-bold text-blue-400 hover:bg-gray-800"
                onClick={closeMenu}
              >
                <Truck size={18} /> Delivery Dashboard
              </Link>
            )}
            {userInfo.role === "user" && (
              <Link
                to="/myorders"
                className="flex items-center gap-2 px-3 py-3 rounded-md font-medium text-gray-300 hover:bg-gray-800"
                onClick={closeMenu}
              >
                <Package size={18} /> My Orders
              </Link>
            )}
            <button
              onClick={logoutHandler}
              className="w-full flex items-center gap-2 px-3 py-3 rounded-md font-bold text-red-500 hover:bg-gray-800"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;