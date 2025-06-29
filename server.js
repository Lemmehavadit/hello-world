require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(express.static('.'));
app.use(express.json());
app.post('/create-checkout-session', async (req, res) => {
  const { priceId, isRecurring, customAmount } = req.body;
  try {
    let session;
    const paymentMethodTypes = ['card', 'apple_pay', 'google_pay'];
    if (isRecurring && customAmount) {
      const productName = `Monthly Contribution - $`;
      const product = await stripe.products.create({ name: productName });
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: customAmount * 100,
        currency: 'usd',
        recurring: { interval: 'month' },
      });
      session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        line_items: [{ price: price.id, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.YOUR_DOMAIN}/success.html`,
        cancel_url: `${process.env.YOUR_DOMAIN}/cancel.html`,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: `${process.env.YOUR_DOMAIN}/success.html`,
        cancel_url: `${process.env.YOUR_DOMAIN}/cancel.html`,
      });
    }
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
