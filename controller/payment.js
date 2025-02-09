const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const JC = require('../utils/Jazzcash');
const braintree = require('braintree');

router.post('/checkout', (req, res, next) => {

  const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    // Use your own credentials from the sandbox Control Panel here
    merchantId: '3nz8xzxsrp3jdtbj',
    publicKey: 'sx646vy3rb8dqgyb',
    privateKey: 'a54490db161349453b627bac5ce8333e'
  });
  gateway.clientToken.generate({}, (err, response) => {
    const clientToken = response.clientToken
  });

  // Use the payment method nonce here
  const nonceFromTheClient = req.body.paymentMethodNonce;
  // Create a new transaction for $10
  const newTransaction = gateway.transaction.sale({
    amount: '10.00',
    paymentMethodNonce: nonceFromTheClient,
    options: {
      // This option requests the funds from the transaction
      // once it has been authorized successfully
      submitForSettlement: true
    }
  }, (error, result) => {
      if (result) {
        res.send(result);
      } else {
        res.status(500).send(error);
      }
  });
});
module.exports = router;