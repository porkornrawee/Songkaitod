import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Restaurant from "../models/restaurantModel.js";
import Coupon from "../models/couponModel.js";
import sendEmail from "../utils/sendEmail.js";
import { getOrderConfirmationTemplate } from "../utils/emailTemplates.js";
import jwt from "jsonwebtoken"; // 👈 เพิ่มไลบรารีนี้เพื่อถอดรหัส Token เอง

// ==========================================
// 🛒 1. CREATE NEW ORDER
// ==========================================
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    couponCode,
    couponDiscount,
  } = req.body;

  try {
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items detected." });
    }

    // 🟢 NEW: เช็คด้วยตัวเองว่ามี Token ส่งมาไหม (Member) หรือไม่มี (Guest)
    let currentUser = null;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUser = await User.findById(decoded.id).select("-password");
      } catch (error) {
        console.log("Invalid or expired token, proceeding as Guest.");
      }
    }

    // สร้างไอดีจำลองให้ Mongoose ยอมรับ สำหรับ Guest
    const guestMongoId = "60d5ecb54b4c000000000000";

    // 🛡️ Generate a 4-digit OTP for secure delivery verification
    const deliveryOTP = Math.floor(1000 + Math.random() * 9000);

    const order = new Order({
      // ✅ ถ้าเป็น Member ใช้ไอดีจริง ถ้าเป็น Guest ใช้ไอดีจำลอง
      user: currentUser ? currentUser._id : guestMongoId, 
      orderItems: orderItems.map((x) => ({
        name: x.name,
        qty: Number(x.qty),
        image: x.image,
        price: Number(x.price),
        product: x.product,
        restaurant: x.restaurant,
        selectedVariant: x.selectedVariant || null,
        selectedAddons: x.selectedAddons || [],
      })),
      shippingAddress: {
        fullName: shippingAddress.fullName,
        address: shippingAddress.address,
        city: shippingAddress.city,
        postalCode: shippingAddress.postalCode,
        state: shippingAddress.state || "Bangkok",
        country: shippingAddress.country || "Thailand",
        phone: shippingAddress.phone,
        lat: typeof shippingAddress.lat === "number" ? shippingAddress.lat : null,
        lng: typeof shippingAddress.lng === "number" ? shippingAddress.lng : null,
      },
      paymentMethod,
      itemsPrice: Number(itemsPrice),
      taxPrice: Number(taxPrice),
      shippingPrice: Number(shippingPrice),
      totalPrice: Number(totalPrice),
      couponCode: couponCode || "",
      couponDiscount: Number(couponDiscount) || 0,
      deliveryOTP,
      isPaid: false,
      orderStatus: "Placed",
    });

    const createdOrder = await order.save();

    // 🎫 Update Coupon Usage Log (บันทึกเฉพาะคนที่เป็น Member)
    if (couponCode && currentUser) {
      await Coupon.findOneAndUpdate(
        { code: couponCode.toUpperCase() },
        { $addToSet: { usedBy: currentUser._id } }
      ).catch((err) => console.log("Coupon Log Update Error:", err.message));
    }

    // 🔔 REAL-TIME SOCKET: Notify Restaurant Owner
    if (req.io) {
      try {
        const restaurantId = createdOrder.orderItems[0].restaurant;
        const restaurantDoc = await Restaurant.findById(restaurantId);

        if (restaurantDoc && restaurantDoc.owner) {
          const ownerId = restaurantDoc.owner.toString();
          req.io.to(ownerId).emit("newOrderReceived", createdOrder);
          console.log(`🔔 Socket: Notification sent to Owner ID: ${ownerId}`);
        }
      } catch (socketError) {
        console.error("Socket Notification Failed:", socketError.message);
      }
    }

    // 📧 Email notification for COD Orders (ส่งเมลเฉพาะคนที่เป็น Member)
    if (paymentMethod === "COD" && currentUser && currentUser.email) {
      try {
        await sendEmail({
          email: currentUser.email,
          subject: `SwadKart: Order Confirmed! ✅ #${createdOrder._id.toString().slice(-6)}`,
          html: getOrderConfirmationTemplate(createdOrder, false),
        });
      } catch (e) {
        console.error("Email Service Error:", e.message);
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("❌ Order Creation Failed:", error.message);
    res.status(500).json({ message: "Validation Failed: " + error.message });
  }
};

// ==========================================
// 🔍 2. GET ORDER BY ID
// ==========================================
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("deliveryPartner", "name phone")
      .populate({
        path: "orderItems.product",
        select: "name image category",
      });

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found." });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 💳 3. UPDATE ORDER TO PAID
// ==========================================
export const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();

      if (req.io) {
        req.io
          .to(updatedOrder._id.toString())
          .emit("orderUpdated", updatedOrder);
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 🚚 4. UPDATE ORDER TO DELIVERED
// ==========================================
export const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.orderStatus = "Delivered";

      if (order.paymentMethod === "COD") {
        order.isPaid = true;
        order.paidAt = Date.now();
      }

      const updatedOrder = await order.save();

      if (req.io) {
        req.io
          .to(updatedOrder._id.toString())
          .emit("orderUpdated", updatedOrder);
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 🛠️ 5. UPDATE ORDER STATUS (Generic)
// ==========================================
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = status;

    if (status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      if (order.paymentMethod === "COD") {
        order.isPaid = true;
        order.paidAt = Date.now();
      }
    }

    const updatedOrder = await order.save();

    // 🔔 Notify User & Delivery Partner
    if (req.io) {
      req.io.to(order._id.toString()).emit("orderUpdated", updatedOrder);

      // If ready, notify delivery partners
      if (status === "Ready") {
        req.io.emit("newDeliveryTask", updatedOrder);
      }
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 📜 6. USER ORDER HISTORY
// ==========================================
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 👨‍🍳 7. RESTAURANT OWNER ORDERS (FIXED)
// ==========================================
export const getMyRestaurantOrders = async (req, res) => {

  console.log("🔥 Controller Hit: getMyRestaurantOrders");
  console.log("👤 User ID:", req.user._id);
  try {
    // 1. Find the restaurant owned by this user
    const restaurant = await Restaurant.findOne({ owner: req.user._id });

    if (!restaurant) {
      console.log("❌ Error: No Restaurant Profile found for this user.");
      return res
        .status(404)
        .json({ message: "No restaurant profile found. Please create one." });
    }
    console.log("✅ Restaurant Found:", restaurant.name);

    // 2. Find orders that contain items from this restaurant
    const orders = await Order.find({
      "orderItems.restaurant": restaurant._id,
    })
      .populate("user", "name email")
      .populate("deliveryPartner", "name phone")
      .sort({ createdAt: -1 });
      console.log(`📦 Orders Found: ${orders.length}`);

    res.json(orders);
  } catch (error) {
    console.error("Error in getMyRestaurantOrders:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 👑 8. ADMIN: ALL ORDERS
// ==========================================
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "id name email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 📈 9. SALES ANALYTICS
// ==========================================
export const getSalesStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 7 },
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 🚫 10. CANCEL ORDER
// ==========================================
export const cancelOrder = async (req, res) => {
  const { reason } = req.body;
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    const restrictedStatuses = ["Out for Delivery", "Delivered"];
    if (restrictedStatuses.includes(order.orderStatus)) {
      return res
        .status(400)
        .json({ message: "Order cannot be cancelled at this stage." });
    }

    order.orderStatus = "Cancelled";
    order.cancellationReason = reason || "Cancelled by User";

    const updatedOrder = await order.save();

    if (req.io) {
      req.io.to(order._id.toString()).emit("orderUpdated", updatedOrder);
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};