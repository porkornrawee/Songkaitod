import React from "react";
import { useParams, Link } from "react-router-dom";
import myQrCode from "../img/qrcode.jpg";

const QrCode = () => {
  const { restaurantId } = useParams();

  const restaurantInfo = {
    name: "หน้า QR Code ของร้าน",
    rating: 4.5,
    isOpenNow: true,
  };
  const loading = false;
  const inStock = [];

  return (
    <div className="bg-white min-h-screen text-black pt-20">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <h1 className="text-3xl font-extrabold mb-4 text-center">QR Code</h1>

        <div className="flex flex-col items-center justify-center ">
          <div className="bg-white shadow-xl mb-4">
            <img src={myQrCode} alt="QR Code" className="w-96" />
          </div>

          <Link to="/" className="mt-6 text-primary underline">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QrCode;
