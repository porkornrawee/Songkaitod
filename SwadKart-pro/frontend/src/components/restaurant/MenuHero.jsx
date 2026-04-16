import React from "react";
import { Star, MapPin, Clock, UtensilsCrossed } from "lucide-react";

const MenuHero = ({ restaurant }) => {
  // If data is not yet loaded, return nothing or a skeleton (returning null here)
  if (!restaurant) return null;

  return (
    <div className="relative h-60 md:h-[450px] w-full bg-gray-900 overflow-hidden">
      {/* 🖼️ Background Image */}
      <img
        src={
          restaurant.image ||
          "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop"
        }
        className="w-full h-full object-cover opacity-60 animate-in fade-in duration-1000"
        alt={restaurant.name}
      />
    </div>
  );
};

export default MenuHero;
