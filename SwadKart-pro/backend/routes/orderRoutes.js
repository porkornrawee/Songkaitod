import express from "express";
const router = express.Router();

// 1. 👇 Order Controller
import {
  addOrderItems,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  updateOrderToPaid,
  cancelOrder,
  getMyRestaurantOrders, 
} from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

// 2. 👇 Delivery Controller
import {
  assignDeliveryPartner,
  updateDeliveryAction,
  updateOrderToDelivered,
  getMyDeliveryOrders,
  triggerSOS,
} from "../controllers/deliveryController.js";

// 3. 👇 Admin Controller
import {
  getSalesStats,
  getDashboardStats,
  getHeatmapData,
} from "../controllers/adminController.js";

// ============================================================
// 👑 ROOT ROUTES (CREATE & ADMIN LIST)
// ============================================================

// ✅ FIX: ปลดล็อก protect ตรง POST ออก เพื่อให้ Guest สั่งของได้
router.post("/", addOrderItems); // 🛒 User & Guest: Create New Order
router.get("/", protect, authorizeRoles("admin"), getOrders); // 👑 Admin: Get All Orders

// ============================================================
// 📊 ANALYTICS & STATS
// ============================================================

router.post("/sos", protect, authorizeRoles("delivery_partner"), triggerSOS);

router.get(
  "/sales-stats",
  protect,
  authorizeRoles("admin", "restaurant_owner"),
  getSalesStats
);

router.get(
  "/analytics",
  protect,
  authorizeRoles("admin", "restaurant_owner"),
  getDashboardStats
);

router.get("/heatmap", protect, authorizeRoles("admin"), getHeatmapData);

// ============================================================
// 👨‍🍳 RESTAURANT OWNER SPECIFIC ROUTES 
// ============================================================

router.get(
  "/restaurant-orders",
  protect,
  authorizeRoles("restaurant_owner"),
  getMyRestaurantOrders
);

// ============================================================
// 🛵 DELIVERY PARTNER ROUTES
// ============================================================

router.get(
  "/my-deliveries",
  protect,
  authorizeRoles("delivery_partner"),
  getMyDeliveryOrders
);

router.put(
  "/:id/delivery-action",
  protect,
  authorizeRoles("delivery_partner"),
  updateDeliveryAction
);

router.put(
  "/:id/deliver",
  protect,
  authorizeRoles("admin", "delivery_partner"),
  updateOrderToDelivered
);

// ============================================================
// 🛒 GENERAL USER ROUTES
// ============================================================

router.get("/myorders", protect, getMyOrders);
router.put("/:id/cancel", protect, cancelOrder);

// ============================================================
// 🔧 RESTAURANT & ADMIN OPERATIONS
// ============================================================

router.put(
  "/:id/status",
  protect,
  authorizeRoles("admin", "restaurant_owner"),
  updateOrderStatus
);

router.put(
  "/:id/assign",
  protect,
  authorizeRoles("admin", "restaurant_owner"),
  assignDeliveryPartner
);

// ============================================================
// 💳 PAYMENT CONFIRMATION
// ============================================================

router.put("/:id/pay", protect, updateOrderToPaid);

// ============================================================
// 🔍 FETCHING BY ID (Must be at the end)
// ============================================================
router.get("/:id", protect, getOrderById);

export default router;