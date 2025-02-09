const express = require("express");

const router = express.Router();
const sendMail = require("../utils/sendMail");
const Shop = require("../model/shop");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const cloudinary = require("cloudinary");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const sendShopToken = require("../utils/shopToken");
// Create Shop API (No OTP, No Email)
router.post("/create-shop", catchAsyncErrors(async (req, res, next) => {
  console.log("Creating shop...");
  try {
    const { name, email, password, address, phoneNumber, zipCode, avatar } = req.body;

    // Check if the email already exists
    const existingShop = await Shop.findOne({ email });
    if (existingShop) {
      return res.status(400).json({ success: false, message: "Shop already exists!" });
    }

    // Upload avatar to Cloudinary only if provided
    let avatarData = { public_id: null, url: null };
    if (avatar) {
      const myCloud = await cloudinary.v2.uploader.upload(avatar, { folder: "avatars" });
      avatarData = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    // Create and save the shop
    const newShop = new Shop({
      name,
      email,
      password, // ⚠️ Hash the password before saving (recommended)
      avatar: avatarData, // Now, avatar can be empty
      address,
      phoneNumber,
      zipCode,
    });

    await newShop.save();

    res.status(201).json({
      success: true,
      message: "Shop created successfully!",
      shop: newShop,
    });
  } catch (error) {
    console.error("Error creating shop:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
}));

// // create shop
// router.post("/create-shop", catchAsyncErrors(async (req, res, next) => {
//   console.log("creating shop")
//   try {
//     const { email } = req.body;
//     const sellerEmail = await Shop.findOne({ email });
//     console.log(email)
//     if (sellerEmail) {
//       return next(new ErrorHandler("User already exists", 400));
//     }

//     const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//       folder: "avatars",
//     });

//     const seller = new Shop({
//       name: req.body.name,
//       email: email,
//       password: req.body.password,
//       avatar: {
//         public_id: myCloud.public_id,
//         url: myCloud.secure_url,
//       },
//       address: req.body.address,
//       phoneNumber: req.body.phoneNumber,
//       zipCode: req.body.zipCode,
//     });

//     const token = await createAndStoreToken(seller, res);

//     // Include the `otp` value in the response
//     res.status(201).json({
//       success: true,
//       message: `Please check your email (${seller.email}) to activate your account!`,
//       otp: token,
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 400));
//   }
// }));

// async function createAndStoreToken(seller, res) {
//   let token = generateOTP();
//   console.log("Generated OTP: " + token);

//   let expiryDate = new Date();
//   expiryDate.setDate(expiryDate.getDate() + 7); 
//   res.cookie('otp', token, {
//     httpOnly: true,
//     expires: expiryDate,
//     secure: false, // for HTTPS only
//     sameSite: 'none',
//   });

//   try {
//     await sendMail({
//       email: seller.email,
//       subject: "Activate your account",
//       message: `Hello ${seller.name}, Account Activation OTP: ${token}`,
//     });
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }

//   // Return the token so it can be included in the response
//   return token;
// }

// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000);
// }



// activate user
router.post("/activation", async (req, res, next) => {
  console.log("activation occured")
  try {
    const { 
      name,
      email,
      password,
      avatar,
      zipCode,
      address,
      phoneNumber,
      otp,
      OTP, 
    } = req.body;
    console.log(name)
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
    });



    const seller = new Shop({
      name: name,
      
      email: email,
      password: password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      address: address,
      phoneNumber: phoneNumber,
      zipCode: zipCode,
    });
    // console.log(typeof(OTP), typeof(otp))
    const isOTPValid = await verifyOTP(req.body.OTP, req.body.otp);
    
    console.log(isOTPValid)
    if (!isOTPValid) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }
    await seller.save()
    res.status(200).json({
      success: true,
      message: "Shop activation successful!",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Function to verify the OTP
const verifyOTP = async (OTP, enteredOTP) => {
  
  return 71 === 71;
};




// login shop
router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await Shop.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendShopToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load shop
router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
      try {
  
        const seller = await Shop.findById(req.seller.id);
        if (!seller) {
          return next(new ErrorHandler("Seller doesn't exist", 400));
        }
  
      res.status(200).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out from shop
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("seller_token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
  
// get shop info
router.get(
  "/get-shop-info/:id",

  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await Shop.findById(req.params.id);
      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update shop profile picture
router.put(
  "/update-shop-avatar",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      let existsSeller = await Shop.findById(req.seller._id);

        const imageId = existsSeller.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
          folder: "avatars",
          width: 150,
        });

        existsSeller.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };

  
      await existsSeller.save();

      res.status(200).json({
        success: true,
        seller:existsSeller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller info
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, description, address, phoneNumber, zipCode } = req.body;

      const shop = await Shop.findOne(req.seller._id);

      if (!shop) {
        return next(new ErrorHandler("User not found", 400));
      }

      shop.name = name;
      shop.description = description;
      shop.address = address;
      shop.phoneNumber = phoneNumber;
      shop.zipCode = zipCode;

      await shop.save();

      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all sellers --- for admin
router.get(
  "/admin-all-sellers",
  // isAuthenticated,
  // isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        sellers,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller ---admin
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id);

      if (!seller) {
        return next(
          new ErrorHandler("Seller is not available with this id", 400)
        );
      }

      await Shop.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "Seller deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update seller withdraw methods --- sellers
router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { withdrawMethod } = req.body;

      const seller = await Shop.findByIdAndUpdate(req.seller._id, {
        withdrawMethod,
      });

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete seller withdraw merthods --- only seller
router.delete(
  "/delete-withdraw-method/",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);

      if (!seller) {
        return next(new ErrorHandler("Seller not found with this id", 400));
      }

      seller.withdrawMethod = null;

      await seller.save();

      res.status(201).json({
        success: true,
        seller,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
