const express = require("express");
const fs = require('fs');
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const sendMail = require("../utils/sendMail");
const Product = require("../model/product");

// create new order
router.post(
  "/create-order",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { orderData, cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;
      console.log(orderData)

      //   group cart items by shopId
      const shopItemsMap = new Map();

      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      }

      // create an order for each shop
      const orders = [];

      for (const [shopId, items] of shopItemsMap) {
        // console.log("Items:", JSON.stringify(items)); // Log the actual data within the items array
        const order = await Order.create({
            cart: items,
            shippingAddress,
            user,
            totalPrice,
            paymentInfo,
        });
        orders.push(order);
    }
      console.log(orders)
      try {
        await sendMail({
            email: user.email,
            subject: "Your Order is Placed",
            html: ` <div class="container">
            <h2>Order Confirmation</h2>
            <p>Dear {{userName}},</p>
            <p>Your order with ID {{orderId}} has been successfully placed.</p>
            <p>Order Details:</p>
            <ul>
                <li>Order ID: {{orderId}}</li>
                <li>Total Price: PKR. {{totalPrice}}</li>
                <li>Order Date: {{createdAt}}</li>
            </ul>
            <p>Thank you for shopping with us!</p>
        </div>`
        });
    } catch (error) {
        // You might want to handle the error here or propagate it up
        console.error("Error sending email:", error);
    }
    

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
function generateEmailHTML(orders) {
  let html = fs.readFileSync('EmailTemplates/index.html', 'utf8');

  orders.forEach(order => {
    // let cartItems = order.cart;
    
    // Replace placeholders in the template with actual data including the cart HTML
    html = html.replace('{{orderId}}', order._id);
    html = html.replace('{{userName}}', order.user.name);
    html = html.replace('{{totalPrice}}', order.totalPrice);
    html = html.replace('{{createdAt}}', order.createdAt);
  
    // Replace '{{cartItems}}' placeholder with the generated cart HTML
    // html = html.replace('{{cartItems}}', cartItems);
  });
  
  return html;
}
  

// get all orders of user
router.get(
  "/get-all-orders/:userId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// get all orders of seller
router.get(
  "/get-seller-all-orders/:shopId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      console.log("shop ID:",req.params.shopId);

const orders = await Order.find({
  "cart.shopId": req.params.shopId,
}).sort({
  createdAt: -1,
});

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update order status for seller
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      console.log(order.user.email)
      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }
      if (req.body.status === "Transferred to delivery partner") {
        order.cart.forEach(async (o) => {
          await updateOrder(o._id, o.qty);
        });
      }

      order.status = req.body.status;

      if (req.body.status === "Delivered") {
        order.deliveredAt = Date.now();
        order.paymentInfo.status = "Succeeded";
        const serviceCharge = order.totalPrice * .10;
        await updateSellerInfo(order.totalPrice - serviceCharge);
      }

      await order.save({ validateBeforeSave: false });
      try {
        await sendMail({
          email: order.user.email,
          subject: "Order Update",
          message: `Hello ${order.user.name}, Thanks for ordering us.You order is ${order.status}.`,
        });
      } catch (error) {
        // You might want to handle the error here or propagate it up
        console.error("Error sending email:", error);
      }
      res.status(200).json({
        success: true,
        order,
      });

      async function updateOrder(id, qty) {
        const product = await Product.findById(id);

        product.stock -= qty;
        product.sold_out += qty;

        await product.save({ validateBeforeSave: false });
      }

      async function updateSellerInfo(amount) {
        const seller = await Shop.findById(req.seller.id);
        
        seller.availableBalance = amount;

        await seller.save();
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);



// all orders --- for admin
router.get(
  "/admin-all-orders",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
