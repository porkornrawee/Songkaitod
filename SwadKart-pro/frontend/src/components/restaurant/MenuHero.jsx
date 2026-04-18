import React from "react";
import { Star, MapPin, Clock, UtensilsCrossed } from "lucide-react";
import img from "../../img/songkaitod.png";

const MenuHero = ({ restaurant }) => {
  // If data is not yet loaded, return nothing or a skeleton (returning null here)
  if (!restaurant) return null;

  return (
  
      <div className="aspect-[16/9] md:aspect-[21/9] w-full">
        {/* 🖼️ Responsive Background Image */}
        <img
          src={restaurant.image || img}
          className="w-full h-full object-contain md:object-cover opacity-80 animate-in fade-in duration-1000"
          alt={restaurant.name}
          sizes="100vw"
        />
      </div>

  );
};

export default MenuHero;
