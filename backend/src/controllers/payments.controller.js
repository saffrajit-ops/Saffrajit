const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const Coupon = require('../models/coupon.model');
const { sendOrderConfirmationEmail } = require('../utils/emailHelpers');

const toCents = n => Math.round(Number(n) * 100);

exports.createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system not configured. Please set STRIPE_SECRET_KEY environment variable.'
      });
    }

    const { items = [], couponCode, shippingAddress } = req.body; // [{ productId, qty }]
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items' });
    }

    // Fetch products from DB, validate qty & stock
    const byId = new Map(items.map(i => [String(i.productId), Number(i.qty || 1)]));
    const products = await Product.find({ _id: { $in: [...byId.keys()] }, isActive: true })
      .select('title price images stock discount shipping').lean();

    if (products.length !== byId.size) {
      return res.status(400).json({ success: false, message: 'Invalid product(s)' });
    }

    const line_items = [];
    const orderItems = [];
    let subtotal = 0;
    let productDiscount = 0;
    let shippingCharges = 0;
    let totalQuantity = 0;

    // First pass: calculate subtotal and quantities
    for (const p of products) {
      const qty = Math.max(1, byId.get(String(p._id)));
      totalQuantity += qty;

      if (typeof p.stock === 'number' && p.stock < qty) {
        return res.status(400).json({ success: false, message: `Out of stock: ${p.title}` });
      }

      // Calculate final price after discount
      let finalPrice = p.price;
      let discountPerItem = 0;

      if (p.discount && p.discount.value > 0) {
        if (p.discount.type === 'percentage') {
          discountPerItem = (p.price * p.discount.value) / 100;
        } else {
          discountPerItem = p.discount.value;
        }
        finalPrice = Math.max(0, p.price - discountPerItem);
        productDiscount += toCents(discountPerItem * qty);
      }

      const finalPriceCents = toCents(finalPrice);
      subtotal += (finalPriceCents * qty);

      line_items.push({
        quantity: qty,
        price_data: {
          currency: 'usd', // Always use USD
          unit_amount: finalPriceCents,
          product_data: {
            name: p.title,
            images: p.images?.length ? [p.images[0].url] : [],
            metadata: { productId: String(p._id) }
          }
        }
      });

      orderItems.push({
        productId: p._id,
        title: p.title,
        unitPrice: Number(finalPrice),
        qty,
        subtotal: Number((finalPriceCents * qty) / 100)
      });
    }

    // Second pass: calculate shipping (after we know total quantity and subtotal)
    const subtotalDollars = subtotal / 100;
    for (const p of products) {
      if (p.shipping && p.shipping.charges > 0) {
        // Check free shipping conditions
        const isFreeByThreshold = p.shipping.freeShippingThreshold > 0 &&
          subtotalDollars >= p.shipping.freeShippingThreshold;
        const isFreeByQuantity = p.shipping.freeShippingMinQuantity > 0 &&
          totalQuantity >= p.shipping.freeShippingMinQuantity;

        // If neither condition is met, add shipping charges
        if (!isFreeByThreshold && !isFreeByQuantity) {
          shippingCharges += toCents(p.shipping.charges);
        }
      }
    }

    // Add shipping as a line item if applicable
    if (shippingCharges > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: 'usd', // Always use USD
          unit_amount: shippingCharges,
          product_data: {
            name: 'Shipping',
            metadata: { type: 'shipping' }
          }
        }
      });
    }

    // Handle coupon validation and discount
    let coupon = null;
    let discount = 0;
    let total = subtotal;

    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase()
      }).populate('appliesTo.productIds appliesTo.taxonomyIds');

      if (!coupon || !coupon.isValid()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon code'
        });
      }

      const subtotalDollars = subtotal / 100;
      if (subtotalDollars < coupon.minSubtotal) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount of $${coupon.minSubtotal} required for this coupon`
        });
      }

      // Check if coupon applies to cart items (if restrictions exist)
      if (coupon.appliesTo.productIds.length > 0 || coupon.appliesTo.taxonomyIds.length > 0) {
        const applicableItems = orderItems.filter(item => {
          return coupon.appliesTo.productIds.some(pid => pid._id.toString() === item.productId.toString());
        });

        if (applicableItems.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Coupon is not applicable to items in your cart'
          });
        }
      }

      // Calculate discount on original subtotal (before product discounts)
      const originalSubtotalDollars = (subtotal + productDiscount) / 100;
      discount = toCents(coupon.calculateDiscount(originalSubtotalDollars));

      // Ensure discount doesn't exceed subtotal (prevent negative total)
      if (discount > subtotal) {
        discount = subtotal;
      }

      // Calculate total: subtotal - discount + shipping
      total = Math.max(0, subtotal - discount + shippingCharges);

      // Don't add discount as line item - we'll use Stripe coupons or handle free orders separately
    }

    // Prepare order data to be stored in session metadata (don't create order yet)
    const orderData = {
      user: req.user?._id ? String(req.user._id) : null,
      items: orderItems.map(item => ({
        product: String(item.productId),
        title: item.title,
        price: item.unitPrice,
        quantity: item.qty,
        subtotal: item.subtotal
      })),
      currency: 'usd',
      subtotal: Number((subtotal + productDiscount) / 100),
      discount: Number(productDiscount / 100),
      shippingCharges: Number(shippingCharges / 100),
      total: Number((subtotal - discount + shippingCharges) / 100),
      shippingAddress: shippingAddress ? {
        label: shippingAddress.label || 'Home',
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country || 'US'
      } : null,
      coupon: coupon && discount > 0 ? {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: Number(discount / 100)
      } : null
    };

    // Handle free orders (total is 0) - create order immediately
    if (total === 0) {
      const freeOrder = await Order.create({
        ...orderData,
        user: req.user?._id,
        items: orderData.items.map(item => ({
          product: item.product,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        })),
        shippingAddress: orderData.shippingAddress,
        coupon: orderData.coupon,
        status: 'confirmed',
        confirmedAt: new Date(),
        payment: {
          method: 'stripe',
          status: 'completed',
          paidAt: new Date()
        }
      });

      // Decrement stock for free orders
      for (const item of freeOrder.items) {
        await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
      }

      // Increment coupon usage for free orders
      if (coupon && coupon.code) {
        await Coupon.updateOne(
          { code: coupon.code },
          { $inc: { usedCount: 1 } }
        );
      }

      return res.status(200).json({
        success: true,
        message: 'Free order processed successfully',
        orderId: freeOrder._id,
        orderNumber: freeOrder.orderNumber,
        isFreeOrder: true
      });
    }

    // Create session configuration with order data in metadata
    // Split data to avoid Stripe's 500 character limit per metadata value
    const sessionConfig = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${process.env.CLIENT_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/skincare`,
      metadata: {
        // Store essential data separately to avoid character limits
        userId: req.user?._id ? String(req.user._id) : '',
        couponCode: coupon?.code || '',
        itemCount: String(orderItems.length),
        subtotal: String(orderData.subtotal),
        discount: String(orderData.discount),
        shippingCharges: String(orderData.shippingCharges),
        total: String(orderData.total),
        // Store items as compact JSON (product IDs, quantities, prices only)
        items: JSON.stringify(orderItems.map(i => ({
          p: String(i.productId),
          t: i.title.substring(0, 50), // Truncate title
          pr: i.unitPrice,
          q: i.qty,
          s: i.subtotal
        }))),
        // Store shipping address separately
        shippingLine1: shippingAddress?.line1?.substring(0, 200) || '',
        shippingLine2: shippingAddress?.line2?.substring(0, 200) || '',
        shippingCity: shippingAddress?.city || '',
        shippingState: shippingAddress?.state || '',
        shippingZip: shippingAddress?.zip || '',
        shippingCountry: shippingAddress?.country || 'US',
        shippingLabel: shippingAddress?.label || 'Home',
        // Store coupon details if applicable
        couponType: coupon?.type || '',
        couponValue: coupon?.value ? String(coupon.value) : '',
        couponDiscount: discount > 0 ? String(Number(discount / 100)) : ''
      }
    };

    // Add discount information if applicable
    if (discount > 0 && total > 0) {
      try {
        // For partial discounts, create a Stripe coupon on the fly
        const stripeCoupon = await stripe.coupons.create({
          amount_off: discount,
          currency: 'usd',
          duration: 'once',
          name: `${coupon.code} - Discount`
        });

        sessionConfig.discounts = [{
          coupon: stripeCoupon.id
        }];
      } catch (stripeCouponError) {
        console.error('Failed to create Stripe coupon, using line item approach:', stripeCouponError);

        // Fallback: add discount as negative line item (but ensure it's valid)
        if (discount < subtotal) {
          line_items.push({
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: -discount,
              product_data: {
                name: `Discount (${coupon.code})`,
                metadata: { couponCode: coupon.code }
              }
            }
          });
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (err) {
    console.error('createCheckoutSession error:', err);
    return res.status(500).json({ success: false, message: 'Failed to start checkout' });
  }
};

// IMPORTANT: mount with express.raw on this single route
// Create COD (Cash on Delivery) order
exports.createCODOrder = async (req, res) => {
  try {
    const { items = [], couponCode, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items' });
    }

    // Fetch products from DB, validate qty & stock
    const byId = new Map(items.map(i => [String(i.productId), Number(i.qty || 1)]));
    const products = await Product.find({ _id: { $in: [...byId.keys()] }, isActive: true })
      .select('title price images stock discount shipping cashOnDelivery returnPolicy').lean();

    if (products.length !== byId.size) {
      return res.status(400).json({ success: false, message: 'Invalid product(s)' });
    }

    // Check if all products support COD
    const nonCODProducts = products.filter(p => !p.cashOnDelivery?.enabled);
    if (nonCODProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some products do not support Cash on Delivery'
      });
    }

    const orderItems = [];
    let subtotal = 0;
    let productDiscount = 0;
    let shippingCharges = 0;
    let totalQuantity = 0;

    // Calculate subtotal and quantities
    for (const p of products) {
      const qty = Math.max(1, byId.get(String(p._id)));
      totalQuantity += qty;

      if (typeof p.stock === 'number' && p.stock < qty) {
        return res.status(400).json({ success: false, message: `Out of stock: ${p.title}` });
      }

      // Calculate final price after discount
      let finalPrice = p.price;
      let discountPerItem = 0;

      if (p.discount && p.discount.value > 0) {
        if (p.discount.type === 'percentage') {
          discountPerItem = (p.price * p.discount.value) / 100;
        } else {
          discountPerItem = p.discount.value;
        }
        finalPrice = Math.max(0, p.price - discountPerItem);
        productDiscount += toCents(discountPerItem * qty);
      }

      const finalPriceCents = toCents(finalPrice);
      subtotal += (finalPriceCents * qty);

      orderItems.push({
        productId: p._id,
        title: p.title,
        unitPrice: Number(finalPrice),
        qty,
        subtotal: Number((finalPriceCents * qty) / 100)
      });
    }

    // Calculate shipping
    const subtotalDollars = subtotal / 100;
    for (const p of products) {
      if (p.shipping && p.shipping.charges > 0) {
        const isFreeByThreshold = p.shipping.freeShippingThreshold > 0 &&
          subtotalDollars >= p.shipping.freeShippingThreshold;
        const isFreeByQuantity = p.shipping.freeShippingMinQuantity > 0 &&
          totalQuantity >= p.shipping.freeShippingMinQuantity;

        if (!isFreeByThreshold && !isFreeByQuantity) {
          shippingCharges += toCents(p.shipping.charges);
        }
      }
    }

    // Handle coupon validation and discount
    let coupon = null;
    let discount = 0;

    if (couponCode) {
      const Coupon = require('../models/coupon.model');
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase()
      }).populate('appliesTo.productIds appliesTo.taxonomyIds');

      if (!coupon || !coupon.isValid()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon code'
        });
      }

      const subtotalDollars = subtotal / 100;
      if (subtotalDollars < coupon.minSubtotal) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount of ${coupon.minSubtotal} required for this coupon`
        });
      }

      // Calculate discount on original subtotal (before product discounts)
      const originalSubtotalDollars = (subtotal + productDiscount) / 100;
      discount = toCents(coupon.calculateDiscount(originalSubtotalDollars));

      if (discount > subtotal) {
        discount = subtotal;
      }
    }

    // Calculate total
    const total = Math.max(0, subtotal - discount + shippingCharges);

    // Create COD order
    const orderData = {
      user: req.user?._id,
      items: orderItems.map(item => ({
        product: item.productId,
        title: item.title,
        price: item.unitPrice,
        quantity: item.qty,
        subtotal: item.subtotal
      })),
      currency: 'usd',
      subtotal: Number((subtotal + productDiscount) / 100),
      discount: Number(productDiscount / 100),
      shippingCharges: Number(shippingCharges / 100),
      total: Number(total / 100),
      status: 'confirmed', // COD orders are confirmed immediately
      confirmedAt: new Date(),
      payment: {
        method: 'cod',
        status: 'pending' // Will be completed on delivery
      }
    };

    // Add shipping address
    if (shippingAddress) {
      orderData.shippingAddress = {
        label: shippingAddress.label || 'Home',
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        zip: shippingAddress.zip,
        country: shippingAddress.country || 'US'
      };
    }

    // Add coupon info
    if (coupon && discount > 0) {
      orderData.coupon = {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: Number(discount / 100)
      };
    }

    const order = await Order.create(orderData);

    // Populate user data for email
    await order.populate('user', 'name email');

    // Send order confirmation email (async, don't wait)
    sendOrderConfirmationEmail(order).catch(err =>
      console.error('Order confirmation email failed:', err)
    );

    // Decrement stock for COD orders
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
    }

    // Increment coupon usage
    if (coupon && coupon.code) {
      const Coupon = require('../models/coupon.model');
      await Coupon.updateOne(
        { code: coupon.code },
        { $inc: { usedCount: 1 } }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'COD order placed successfully',
      orderId: order._id,
      orderNumber: order.orderNumber,
      data: order
    });
  } catch (err) {
    console.error('createCODOrder error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create COD order' });
  }
};

// Verify session and create order (fallback for when webhooks don't work)
exports.verifySession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: 'Payment system not configured'
      });
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    console.log(`🔍 Verifying session: ${sessionId}`);
    console.log(`   Checking for existing order with session ID...`);

    // Check if order already exists for this session
    const existingOrder = await Order.findOne({ 'payment.sessionId': sessionId })
      .populate('items.product', 'title slug price images returnPolicy');

    if (existingOrder) {
      console.log(`✅ Order already exists: ${existingOrder.orderNumber}`);
      console.log(`   Returning existing order, NOT creating new one`);
      return res.status(200).json({
        success: true,
        order: existingOrder,
        message: 'Order already created'
      });
    }

    console.log(`   No existing order found, proceeding to create new order...`);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    console.log(`✅ Payment confirmed for session: ${sessionId}`);

    // Reconstruct order data from metadata
    const metadata = session.metadata;
    if (!metadata || !metadata.items) {
      return res.status(400).json({
        success: false,
        message: 'No order data found in session'
      });
    }

    console.log(`📦 Creating order from session...`);

    // Parse items from compact format
    const items = JSON.parse(metadata.items).map(i => ({
      product: i.p,
      title: i.t,
      price: i.pr,
      quantity: i.q,
      subtotal: i.s
    }));

    // Reconstruct shipping address
    const shippingAddress = metadata.shippingLine1 ? {
      label: metadata.shippingLabel || 'Home',
      line1: metadata.shippingLine1,
      line2: metadata.shippingLine2 || '',
      city: metadata.shippingCity,
      state: metadata.shippingState,
      zip: metadata.shippingZip,
      country: metadata.shippingCountry || 'US'
    } : null;

    // Reconstruct coupon data
    const coupon = metadata.couponCode ? {
      code: metadata.couponCode,
      type: metadata.couponType,
      value: parseFloat(metadata.couponValue || '0'),
      discount: parseFloat(metadata.couponDiscount || '0')
    } : null;

    const orderData = {
      user: metadata.userId || null,
      items,
      currency: 'usd',
      subtotal: parseFloat(metadata.subtotal),
      discount: parseFloat(metadata.discount),
      shippingCharges: parseFloat(metadata.shippingCharges),
      total: parseFloat(metadata.total),
      shippingAddress,
      coupon
    };

    // Create the order
    const order = await Order.create({
      user: orderData.user || null,
      items: orderData.items.map(item => ({
        product: item.product,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal
      })),
      currency: orderData.currency,
      subtotal: orderData.subtotal,
      discount: orderData.discount,
      shippingCharges: orderData.shippingCharges,
      total: orderData.total,
      shippingAddress: orderData.shippingAddress,
      coupon: orderData.coupon,
      status: 'confirmed',
      confirmedAt: new Date(),
      payment: {
        method: 'stripe',
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        status: 'completed',
        paidAt: new Date()
      }
    });

    console.log(`✅ Order created: ${order._id} (${order.orderNumber})`);

    // Decrement stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
    }
    console.log(`✅ Stock decremented`);

    // Clear cart
    if (orderData.user) {
      try {
        const Cart = require('../models/cart.model');
        await Cart.findOneAndUpdate(
          { userId: orderData.user },
          { $set: { items: [], couponCode: undefined, couponDiscount: 0 } }
        );
        console.log(`✅ Cart cleared`);
      } catch (cartError) {
        console.error('Failed to clear cart:', cartError);
      }
    }

    // Increment coupon usage
    if (order.coupon?.code) {
      await Coupon.updateOne(
        { code: order.coupon.code },
        { $inc: { usedCount: 1 } }
      );
      console.log(`✅ Coupon usage incremented`);
    }

    console.log(`🎉 Order ${order.orderNumber} fully processed!`);

    // Populate product details before returning
    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'title slug price images returnPolicy')
      .populate('user', 'name email');

    // Send order confirmation email (async, don't wait)
    sendOrderConfirmationEmail(populatedOrder).catch(err =>
      console.error('Order confirmation email failed:', err)
    );

    return res.status(200).json({
      success: true,
      order: populatedOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Verify session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify session and create order',
      error: error.message
    });
  }
};

exports.webhook = async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      success: false,
      message: 'Payment system not configured. Please set STRIPE_SECRET_KEY environment variable.'
    });
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentIntentId = session.payment_intent;

      // Reconstruct order data from metadata
      const metadata = session.metadata;
      if (!metadata || !metadata.items) {
        console.error('No order data found in session metadata');
        return res.status(400).json({ error: 'No order data in session' });
      }

      console.log(`🔔 WEBHOOK: Payment successful for session: ${session.id}`);
      console.log(`   Checking for existing order...`);

      // Parse items from compact format
      const items = JSON.parse(metadata.items).map(i => ({
        product: i.p,
        title: i.t,
        price: i.pr,
        quantity: i.q,
        subtotal: i.s
      }));

      // Reconstruct shipping address
      const shippingAddress = metadata.shippingLine1 ? {
        label: metadata.shippingLabel || 'Home',
        line1: metadata.shippingLine1,
        line2: metadata.shippingLine2 || '',
        city: metadata.shippingCity,
        state: metadata.shippingState,
        zip: metadata.shippingZip,
        country: metadata.shippingCountry || 'US'
      } : null;

      // Reconstruct coupon data
      const coupon = metadata.couponCode ? {
        code: metadata.couponCode,
        type: metadata.couponType,
        value: parseFloat(metadata.couponValue || '0'),
        discount: parseFloat(metadata.couponDiscount || '0')
      } : null;

      const orderData = {
        user: metadata.userId || null,
        items,
        currency: 'usd',
        subtotal: parseFloat(metadata.subtotal),
        discount: parseFloat(metadata.discount),
        shippingCharges: parseFloat(metadata.shippingCharges),
        total: parseFloat(metadata.total),
        shippingAddress,
        coupon
      };

      // Check if order already exists for this session (prevent duplicates)
      const existingOrder = await Order.findOne({ 'payment.sessionId': session.id });
      if (existingOrder) {
        console.log(`⚠️ WEBHOOK: Order already exists: ${existingOrder.orderNumber}`);
        console.log(`   Skipping creation to prevent duplicate`);
        return res.json({ received: true, orderId: existingOrder._id });
      }

      console.log(`   No existing order found`);
      console.log(`📦 WEBHOOK: Creating new order...`);

      // Create the order now that payment is confirmed
      const order = await Order.create({
        user: orderData.user || null,
        items: orderData.items.map(item => ({
          product: item.product,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal
        })),
        currency: orderData.currency,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        shippingCharges: orderData.shippingCharges,
        total: orderData.total,
        shippingAddress: orderData.shippingAddress,
        coupon: orderData.coupon,
        status: 'confirmed',
        confirmedAt: new Date(),
        payment: {
          method: 'stripe',
          sessionId: session.id,
          paymentIntentId: paymentIntentId,
          status: 'completed',
          paidAt: new Date()
        }
      });

      console.log(`✅ Order created: ${order._id} (${order.orderNumber})`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Payment Status: ${order.payment.status}`);
      console.log(`   - Total: $${order.total}`);

      // Decrement stock atomically per item
      for (const item of order.items) {
        const result = await Product.updateOne(
          { _id: item.product, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }
        );
        console.log(`   - Stock updated for product ${item.product}: ${result.modifiedCount} modified`);
      }
      console.log(`✅ Stock decremented for order: ${order.orderNumber}`);

      // Clear user's cart if user is authenticated
      if (orderData.user) {
        try {
          const Cart = require('../models/cart.model');
          await Cart.findOneAndUpdate(
            { userId: orderData.user },
            { $set: { items: [], couponCode: undefined, couponDiscount: 0 } }
          );
          console.log(`✅ Cart cleared for user: ${orderData.user}`);
        } catch (cartError) {
          console.error('Failed to clear cart:', cartError);
          // Don't fail the whole webhook if cart clear fails
        }
      }

      // Increment coupon usage count if coupon was used
      if (order.coupon?.code) {
        await Coupon.updateOne(
          { code: order.coupon.code },
          { $inc: { usedCount: 1 } }
        );
        console.log(`✅ Coupon usage incremented for: ${order.coupon.code}`);
      }

      console.log(`🎉 Order ${order.orderNumber} fully processed!`);

      // Populate user data and send order confirmation email (async, don't wait)
      Order.findById(order._id)
        .populate('user', 'name email')
        .then(populatedOrder => {
          if (populatedOrder) {
            sendOrderConfirmationEmail(populatedOrder).catch(err =>
              console.error('Order confirmation email failed:', err)
            );
          }
        })
        .catch(err => console.error('Failed to populate order for email:', err));

    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      console.log(`Payment session expired: ${session.id}`);
      // No order to mark as failed since we don't create it until payment succeeds
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook handling failed:', err);
    return res.status(500).send('Webhook handler failed');
  }
};
