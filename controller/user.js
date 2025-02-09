const express = require("express");
const User = require("../model/user");
const router = express.Router();
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const bcrypt = require('bcryptjs');

const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const crypto = require('crypto');


// create user
// router.post("/create-user", async (req, res, next) => {
//   console.log("creating user");
//   try {
//     const { name, email, password } = req.body;
//     const userEmail = await User.findOne({ email });

//     if (userEmail) {
//       return next(new ErrorHandler("User already exists", 400));
//     }


//     const newUser = new User({
//       name: name,
//       email: email,
//       password: password,

//     });
//     const token = await createAndStoreToken(newUser, res); // Pass newUser to the function
//     res.status(201).json({
//       success: true,
//       message: `Please check your email (${email}) to activate your account!`,
//       otp: token, // You might want to pass the generated token in the response
//     });
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 400));
//   }
// });

// async function createAndStoreToken(newUser, res) {
//   let token = generateOTP();
//   console.log("Generated OTP: " + token);

//   let expiryDate = new Date();
//   expiryDate.setDate(expiryDate.getDate() + 7); 
//   const otp = token;

//   try {
//     await sendMail({
//       email: newUser.email,
//       subject: "Activate your account",
//       message: `Hello ${newUser.name}, Here is Account Activation OTP : ${token}`,
//     });
//   } catch (error) {
//     // You might want to handle the error here or propagate it up
//     console.error("Error sending email:", error);
//   }

//   console.log("Token stored in cookie.");
//   return otp; // You might want to return the token for further use
// }
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000);
// }

router.post("/create-user", async (req, res, next) => {
  console.log("creating user");

  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password!",
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User doesn't exist!",
      });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password!",
      });
    }

    // Return success response without token
    res.status(200).json({
      success: true,
      message: "User logged in successfully!",
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return next(error); // Pass error to the error handling middleware
  }
});

// activate user
router.post("/activation", async (req, res, next) => {
  try {
    const { name, email, password, avatar, otp, OTP } = req.body;
    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    });

    const newUser = new User({
      name: name,
      email: email,
      password: password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });
    const isOTPValid = await verifyOTP(req.body.OTP, req.body.otp);
    console.log(isOTPValid)
    if (!isOTPValid) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }
    await newUser.save();
    res.status(200).json({
      success: true,
      message: "Account activation successful!",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Function to verify the OTP
const verifyOTP = async (OTP, enteredOTP) => {
  return OTP === enteredOTP;
};

// login user
// router.post(  
//   "/login-user",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { email, password } = req.body;

//       if (!email || !password) {
//         return next(new ErrorHandler("Please provide the all fields!", 400));
//       }

//       const user = await User.findOne({ email }).select("+password");

//       if (!user) {
//         return next(new ErrorHandler("User doesn't exists!", 400));
//       }

//       const isPasswordValid = await user.comparePassword(password);

//       if (!isPasswordValid) {
//         return next(
//           new ErrorHandler("Please provide the correct information", 400)
//         );
//       }
//       sendToken(user, 201, res);
//       // res.cookie("user","HEllo")
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// router.post(
//   "/login-user",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { email, password } = req.body;

//       // Check if email and password are provided
//       if (!email || !password) {
//         return next(new ErrorHandler("Please provide both email and password!", 400));
//       }

//       // Find the user by email and select the password field
//       const user = await User.findOne({ email }).select("+password");

//       // If the user doesn't exist, return an error
//       if (!user) {
//         return next(new ErrorHandler("User doesn't exist!", 400));
//       }

//       // Compare the entered password with the stored hashed password
//       const isPasswordValid = await user.comparePassword(password);

//       // If password is incorrect, return an error
//       if (!isPasswordValid) {
//         return next(new ErrorHandler("Please provide the correct password", 400));
//       }

//       // Generate JWT token for the logged-in user
//       const token = user.getJwtToken(); // Use the method defined in the User model

//       // Return success response with token
//       res.status(200).json({
//         success: true,
//         message: "User logged in successfully!",
//         token, // Send the JWT token to the client
//         user: {
//           name: user.name,
//           email: user.email,
//         },
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500)); // Catch and send error to the handler
//     }
//   })
// );
// router.post(
//   "/login-user",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { email } = req.body;

//       // Check if email is provided
//       if (!email) {
//         return next(new ErrorHandler("Please provide an email!", 400));
//       }

//       // Correct query to find user by email
//       const user = await User.findOne({ email: email }); // Correct query format

//       // If user doesn't exist, return an error
//       if (!user) {
//         return next(new ErrorHandler("User doesn't exist!", 400));
//       }

//       // Directly return a success response with mock user data
//       res.status(200).json({
//         success: true,
//         message: "User logged in successfully!",
//         user: {
//           name: user.name,
//           email: user.email,
//         },
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500)); // Catch and send error to the handler
//     }
//   })
// );
// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {

      // const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      // req.user = await User.findById(decoded.id);

      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
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


// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
     
      let existsUser = await User.findById(req.user.id);
      if (req.body.avatar !== "") {
        const imageId = existsUser.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
          folder: "avatars",
          width: 150,
        });

        existsUser.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      await existsUser.save();

      res.status(200).json({
        success: true,
        user: existsUser,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.delete(
  "/delete-user-address/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Password doesn't matched with each other!", 400)
        );
      }
      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// find user infoormation with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all users --- for admin
router.get(
  "/admin-all-users",
  // isAuthenticated,
  // isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      const imageId = user.avatar.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
router.get(
  "/getSeller",
  catchAsyncErrors(async (req, res, next) => {
      try {
  
        const seller = await Shop.findById(req.body.sellerId);
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

module.exports = router;
