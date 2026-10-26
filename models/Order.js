const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true }
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, default: '' }
  }],
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 50 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cod'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  status: { type: String, enum: ['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'], default: 'new' },
  giftMessage: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
