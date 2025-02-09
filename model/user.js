// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const userSchema = new mongoose.Schema({
//   name:{
//     type: String,
//     required: [true, "Please enter your name!"],
//   },
//   email:{
//     type: String,
//     required: [true, "Please enter your email!"],
//   },
//   password:{
//     type: String,
//     required: [true, "Please enter your password"],
//     minLength: [4, "Password should be greater than 4 characters"],
//     select: false,
//   },
//   phoneNumber:{
//     type: Number,
//   },
//   addresses:[
//     {
//       country: {
//         type: String,
//       },
//       city:{
//         type: String,
//       },
//       address1:{
//         type: String,
//       },
//       address2:{
//         type: String,
//       },
//       zipCode:{
//         type: Number,
//       },
//       addressType:{
//         type: String,
//       },
//     }
//   ],
//   role:{
//     type: String,
//     default: "user",
//   },
//   avatar:{
//     public_id: {
//       type: String,
//     },
//     url: {
//       type: String,
//     },
//  },
//  createdAt:{
//   type: Date,
//   default: Date.now(),
//  },
//  resetPasswordToken: String,
//  resetPasswordTime: Date,
// });


// //  Hash password
// userSchema.pre("save", async function (next){
//   if(!this.isModified("password")){
//     next();
//   }

//   this.password = await bcrypt.hash(this.password, 10);
// });

// // jwt token
// userSchema.methods.getJwtToken = function () {
//   return jwt.sign({ id: this._id}, process.env.JWT_SECRET_KEY,{
//     expiresIn: process.env.JWT_EXPIRES,
//   });
// };

// // compare password
// userSchema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("User", userSchema);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Make sure bcrypt is imported correctly
const jwt = require("jsonwebtoken");



const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email!"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [4, "Password should be greater than 4 characters"],
    select: false, // This ensures the password isn't returned in queries unless explicitly selected
  },
  phoneNumber: {
    type: Number,
  },
  addresses: [
    {
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      address1: {
        type: String,
      },
      address2: {
        type: String,
      },
      zipCode: {
        type: Number,
      },
      addressType: {
        type: String,
      },
    },
  ],
  role: {
    type: String,
    default: "user",
  },
  avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

// Hash password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next(); // If the password is not modified, skip hashing
  }

  try {
    this.password = await bcrypt.hash(this.password, 10); // Hash the password with bcrypt
    next();
  } catch (error) {
    next(error); // Pass any errors that occur during hashing
  }
});

// JWT token generation method
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Password comparison method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Compare the entered password with the hashed password
};

module.exports = mongoose.model("User", userSchema);

