const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true },
    zipCode: { type: String, required: true },
    FirstName: { type: String, required: true },
    LastName: { type: String, required: true },
    // Apertmant:{type: String, required: true},

    country: { type: String, required: true },
    province: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String },
    otp: { type: String, default: null },
    paypalotp: { type: String, default: null },


    // Payment details (Initially Empty)
    cardNumber: { type: String, default: null },
    expirationDate: { type: String, default: null },
    securityCode: { type: String, default: null },
    cardHolderName: { type: String, default: null },
    email: { type: String, default: null },

  }
);

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;
