// const ErrorHandler = require("../utils/ErrorHandler");
// const catchAsyncErrors = require("./catchAsyncErrors");
// const jwt = require("jsonwebtoken");
// const User = require("../model/user");
// const Shop = require("../model/shop");
// require('dotenv').config(); 

// exports.isAuthenticated = catchAsyncErrors(async(req,res,next) => {
    
//     const token = req.headers['x-access-token'];
//     console.log(token)
//     if(!token){

//         return next(new ErrorHandler("Please login to continue", 401));
//     }
//     const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
//     req.user = await User.findById(decoded.id);
//     next();
// });


// exports.isSeller = catchAsyncErrors(async(req,res,next) => {
//     const seller_token = req.headers['x-access-token'];

//     if(!seller_token){
//         return next(new ErrorHandler("Please login to continue", 401));
//     }

//     const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);

//     req.seller = await Shop.findById(decoded.id);

//     next();
// });


// exports.isAdmin = (...roles) => {
//     return (req,res,next) => {
//         if(!roles.includes(req.user.role)){
//             return next(new ErrorHandler(`${req.user.role} can not access this resources!`))
//         };
//         next();
//     }
// }
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");
require('dotenv').config(); 

// Middleware for checking if the user is authenticated
exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    // Removed the token check and verification logic
    // Now, we just pass to the next middleware or route without checking authentication
    next();
});

// Middleware for checking if the seller is authenticated
exports.isSeller = catchAsyncErrors(async (req, res, next) => {
    next();

});

// Middleware for checking if the user has an admin role
exports.isAdmin = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`${req.user.role} cannot access this resource!`, 403)); // Added 403 Forbidden
        };
        next();
    };
};
