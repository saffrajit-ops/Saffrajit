// Base email template
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 300;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #6c757d;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .order-details {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .order-item {
      border-bottom: 1px solid #dee2e6;
      padding: 15px 0;
    }
    .order-item:last-child {
      border-bottom: none;
    }
    .tracking-info {
      background-color: #e7f3ff;
      padding: 20px;
      border-left: 4px solid #667eea;
      margin: 20px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-confirmed { background-color: #d1ecf1; color: #0c5460; }
    .status-processing { background-color: #d4edda; color: #155724; }
    .status-shipped { background-color: #cce5ff; color: #004085; }
    .status-delivered { background-color: #d4edda; color: #155724; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CANAGOLD BEAUTY</h1>
    </div>
    ${content}
    <div class="footer">
      <p><strong>CanaGold Beauty</strong></p>
      <p>Thank you for choosing us!</p>
      <p style="font-size: 12px; color: #999;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  </div>
</body>
</html>
`;

// Welcome email template
const welcomeEmail = (userName) => {
    const content = `
    <div class="content">
      <h2 style="color: #333;">Welcome to CanaGold Beauty! 🎉</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>Thank you for creating an account with us! We're thrilled to have you join our community.</p>
      <p>Discover our exclusive collection of premium beauty products designed to enhance your natural beauty.</p>
      <a href="${process.env.CLIENT_URL}/skincare" class="button">Start Shopping</a>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Login notification email
const loginNotification = (userName, loginTime, ipAddress) => {
    const content = `
    <div class="content">
      <h2 style="color: #333;">New Login Detected 🔐</h2>
      <p>Hi <strong>${userName}</strong>,</p>
      <p>We detected a new login to your account:</p>
      <div class="tracking-info">
        <p><strong>Time:</strong> ${loginTime}</p>
        <p><strong>IP Address:</strong> ${ipAddress}</p>
      </div>
      <p>If this wasn't you, please secure your account immediately by changing your password.</p>
      <a href="${process.env.CLIENT_URL}/profile/settings" class="button">Secure Account</a>
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Order confirmation email
const orderConfirmation = (order) => {
    const itemsHtml = order.items.map(item => `
    <div class="order-item">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>${item.title}</strong><br>
          <span style="color: #6c757d;">Quantity: ${item.quantity}</span>
        </div>
        <div style="text-align: right;">
          <strong>$${item.subtotal.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  `).join('');

    const content = `
    <div class="content">
      <h2 style="color: #333;">Order Confirmed! 🎉</h2>
      <p>Hi <strong>${order.user?.name}</strong>,</p>
      <p>Thank you for your order! We've received your order and it's being processed.</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Payment Method:</strong> ${order.payment.method.toUpperCase()}</p>
        <p><strong>Payment Status:</strong> <span class="status-badge status-${order.payment.status}">${order.payment.status}</span></p>
      </div>

      <h3>Order Items:</h3>
      <div class="order-details">
        ${itemsHtml}
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #dee2e6;">
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Subtotal:</span>
            <strong>$${order.subtotal.toFixed(2)}</strong>
          </div>
          ${order.discount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 10px 0; color: #28a745;">
            <span>Discount:</span>
            <strong>-$${order.discount.toFixed(2)}</strong>
          </div>
          ` : ''}
          ${order.shippingCharges > 0 ? `
          <div style="display: flex; justify-content: space-between; margin: 10px 0;">
            <span>Shipping:</span>
            <strong>$${order.shippingCharges.toFixed(2)}</strong>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 18px; color: #667eea;">
            <span><strong>Total:</strong></span>
            <strong>$${order.total.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      ${order.shippingAddress ? `
      <h3>Shipping Address:</h3>
      <div class="order-details">
        <p>${order.shippingAddress.line1}</p>
        ${order.shippingAddress.line2 ? `<p>${order.shippingAddress.line2}</p>` : ''}
        <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}</p>
        <p>${order.shippingAddress.country}</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/profile/orders" class="button">View Order Details</a>
        <a href="${process.env.CLIENT_URL}/api/orders/${order._id}/invoice" class="button" style="background: #28a745;">Download Invoice</a>
      </div>

      <p>You'll receive another email when your order ships.</p>
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Order status update email
const orderStatusUpdate = (order, oldStatus, newStatus) => {
    const statusMessages = {
        confirmed: 'Your order has been confirmed and will be processed soon.',
        processing: 'Your order is being prepared for shipment.',
        shipped: 'Great news! Your order has been shipped.',
        delivered: 'Your order has been delivered. We hope you love it!',
        cancelled: 'Your order has been cancelled.',
    };

    const trackingHtml = order.shipping?.trackingNumber ? `
    <div class="tracking-info">
      <h3 style="margin-top: 0;">Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${order.shipping.trackingNumber}</p>
      <p><strong>Shipped Date:</strong> ${new Date(order.shipping.shippedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      ${order.shipping.notes ? `<p><strong>Notes:</strong> ${order.shipping.notes}</p>` : ''}
    </div>
  ` : '';

    const content = `
    <div class="content">
      <h2 style="color: #333;">Order Status Updated 📦</h2>
      <p>Hi <strong>${order.user?.name}</strong>,</p>
      <p>Your order <strong>#${order.orderNumber}</strong> status has been updated.</p>
      
      <div class="order-details">
        <div style="text-align: center; padding: 20px;">
          <p style="color: #6c757d; margin: 0;">Status changed from</p>
          <span class="status-badge status-${oldStatus}">${oldStatus}</span>
          <p style="margin: 10px 0;">↓</p>
          <span class="status-badge status-${newStatus}">${newStatus}</span>
        </div>
      </div>

      <p>${statusMessages[newStatus] || 'Your order status has been updated.'}</p>

      ${trackingHtml}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/profile/orders" class="button">Track Your Order</a>
      </div>

      <p>Thank you for shopping with us!</p>
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Order tracking email
const orderTracking = (order) => {
    const timeline = [];

    if (order.createdAt) {
        timeline.push({ status: 'Order Placed', date: order.createdAt, completed: true });
    }
    if (order.confirmedAt) {
        timeline.push({ status: 'Confirmed', date: order.confirmedAt, completed: true });
    }
    if (order.processing?.startedAt) {
        timeline.push({ status: 'Processing', date: order.processing.startedAt, completed: true });
    }
    if (order.shipping?.shippedAt) {
        timeline.push({ status: 'Shipped', date: order.shipping.shippedAt, completed: true });
    }
    if (order.delivery?.deliveredAt) {
        timeline.push({ status: 'Delivered', date: order.delivery.deliveredAt, completed: true });
    }

    const timelineHtml = timeline.map((item, index) => `
    <div style="display: flex; align-items: center; margin: 15px 0;">
      <div style="width: 30px; height: 30px; border-radius: 50%; background-color: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
        ${index + 1}
      </div>
      <div style="margin-left: 15px; flex: 1;">
        <strong>${item.status}</strong><br>
        <span style="color: #6c757d; font-size: 14px;">${new Date(item.date).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  `).join('');

    const content = `
    <div class="content">
      <h2 style="color: #333;">Order Tracking 📍</h2>
      <p>Hi <strong>${order.user?.name}</strong>,</p>
      <p>Here's the latest tracking information for your order <strong>#${order.orderNumber}</strong>:</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0;">Order Timeline</h3>
        ${timelineHtml}
      </div>

      ${order.shipping?.trackingNumber ? `
      <div class="tracking-info">
        <h3 style="margin-top: 0;">Tracking Details</h3>
        <p><strong>Tracking Number:</strong> ${order.shipping.trackingNumber}</p>
        <p><strong>Current Status:</strong> <span class="status-badge status-${order.status}">${order.status}</span></p>
        ${order.shipping.notes ? `<p><strong>Notes:</strong> ${order.shipping.notes}</p>` : ''}
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/profile/orders" class="button">View Full Details</a>
      </div>

      <p>Thank you for your patience!</p>
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// OTP Verification Email
const otpVerificationEmail = (name, otp) => {
    const content = `
    <div class="content">
      <h2 style="color: #333;">Verify Your Email Address 🔐</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for registering with Cana Gold! To complete your registration, please use the following One-Time Password (OTP):</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px 50px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
          <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>
      </div>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Important:</strong> This OTP is valid for <strong>15 minutes</strong> only. Please do not share this code with anyone.
        </p>
      </div>
      
      <p>If you didn't request this verification, please ignore this email or contact our support team.</p>
      
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Order Cancellation Email
const orderCancellation = (order, reason) => {
    const refundInfo = order.paymentMethod === 'prepaid' ? `
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #0c5460;">
        <strong>💰 Refund Information:</strong><br>
        Your refund of <strong>$${order.total.toFixed(2)}</strong> will be processed within 5-7 business days to your original payment method.
      </p>
    </div>
  ` : `
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #0c5460;">
        <strong>💰 Payment Information:</strong><br>
        This was a Cash on Delivery order. No payment was collected, so no refund is necessary.
      </p>
    </div>
  `;

    const content = `
    <div class="content">
      <h2 style="color: #dc3545;">Order Cancelled ❌</h2>
      <p>Hi <strong>${order.user?.name}</strong>,</p>
      <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0;">Cancellation Details</h3>
        <p><strong>Order Number:</strong> #${order.orderNumber}</p>
        <p><strong>Cancelled Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Order Total:</strong> $${order.total.toFixed(2)}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>

      ${refundInfo}

      <div class="order-details">
        <h3 style="margin-top: 0;">Cancelled Items</h3>
        ${order.items.map(item => `
          <div style="border-bottom: 1px solid #e9ecef; padding: 10px 0;">
            <p style="margin: 5px 0;"><strong>${item.product?.name || 'Product'}</strong></p>
            <p style="margin: 5px 0; color: #6c757d;">Quantity: ${item.quantity} × $${item.price.toFixed(2)}</p>
          </div>
        `).join('')}
      </div>

      <p>We're sorry to see this order cancelled. If you have any questions or concerns, please don't hesitate to contact our customer support team.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/profile/orders" class="button">View Order History</a>
      </div>

      <p>We hope to serve you again soon!</p>
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Return Request Submitted Email
const returnRequestSubmitted = (order, returnRequest) => {
    const content = `
    <div class="content">
      <h2 style="color: #ffc107;">Return Request Submitted 📦</h2>
      <p>Hi <strong>${order.user?.name}</strong>,</p>
      <p>We've received your return request for order <strong>#${order.orderNumber}</strong>.</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0;">Return Request Details</h3>
        <p><strong>Order Number:</strong> #${order.orderNumber}</p>
        <p><strong>Request Date:</strong> ${new Date(returnRequest.requestedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Reason:</strong> ${returnRequest.reason}</p>
        ${returnRequest.description ? `<p><strong>Description:</strong> ${returnRequest.description}</p>` : ''}
        <p><strong>Status:</strong> <span class="status-badge status-requested">Pending Review</span></p>
      </div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404;">
          <strong>⏳ What's Next?</strong><br>
          Our team will review your return request within 24-48 hours. You'll receive an email once your request is approved or if we need additional information.
        </p>
      </div>

      <div class="order-details">
        <h3 style="margin-top: 0;">Items to Return</h3>
        ${order.items.map(item => `
          <div style="border-bottom: 1px solid #e9ecef; padding: 10px 0;">
            <p style="margin: 5px 0;"><strong>${item.product?.name || 'Product'}</strong></p>
            <p style="margin: 5px 0; color: #6c757d;">Quantity: ${item.quantity} × $${item.price.toFixed(2)}</p>
          </div>
        `).join('')}
        <p style="margin-top: 10px;"><strong>Total Amount:</strong> $${order.total.toFixed(2)}</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/profile/orders" class="button">Track Return Status</a>
      </div>

      <p>Thank you for your patience!</p>
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Return Request Approved Email
const returnRequestApproved = (order, returnRequest) => {
    const content = `
    <div class="content">
      <h2 style="color: #28a745;">Return Request Approved ✅</h2>
      <p>Hi <strong>${order.user?.name}</strong>,</p>
      <p>Great news! Your return request for order <strong>#${order.orderNumber}</strong> has been approved.</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0;">Return Details</h3>
        <p><strong>Order Number:</strong> #${order.orderNumber}</p>
        <p><strong>Approved Date:</strong> ${new Date(returnRequest.approvedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Return Amount:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Status:</strong> <span class="status-badge status-approved">Approved</span></p>
      </div>

      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #155724;">
          <strong>📦 Next Steps:</strong><br>
          Please ship the items back to us using the return address below. Once we receive and inspect the items, we'll process your refund.
        </p>
      </div>

      <div class="order-details">
        <h3 style="margin-top: 0;">Return Shipping Address</h3>
        <p style="margin: 5px 0;">CanaGold Beauty Returns Department</p>
        <p style="margin: 5px 0;">123 Beauty Lane</p>
        <p style="margin: 5px 0;">Los Angeles, CA 90001</p>
        <p style="margin: 5px 0;">United States</p>
      </div>

      <div class="order-details">
        <h3 style="margin-top: 0;">Return Instructions</h3>
        <ol style="padding-left: 20px; color: #666;">
          <li>Pack the items securely in their original packaging if possible</li>
          <li>Include a copy of your order confirmation or order number</li>
          <li>Ship to the address above</li>
          <li>Keep your tracking number for reference</li>
        </ol>
      </div>

      ${order.paymentMethod === 'prepaid' ? `
      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #0c5460;">
          <strong>💰 Refund Information:</strong><br>
          Your refund of <strong>$${order.total.toFixed(2)}</strong> will be processed within 5-7 business days after we receive and inspect the returned items.
        </p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/profile/orders" class="button">View Return Status</a>
      </div>

      <p>Thank you for your cooperation!</p>
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Return Request Rejected Email
const returnRequestRejected = (order, returnRequest, rejectionReason) => {
    const content = `
    <div class="content">
      <h2 style="color: #dc3545;">Return Request Declined ❌</h2>
      <p>Hi <strong>${order.user?.name}</strong>,</p>
      <p>We regret to inform you that your return request for order <strong>#${order.orderNumber}</strong> has been declined.</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0;">Return Request Details</h3>
        <p><strong>Order Number:</strong> #${order.orderNumber}</p>
        <p><strong>Request Date:</strong> ${new Date(returnRequest.requestedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Status:</strong> <span class="status-badge status-cancelled">Rejected</span></p>
      </div>

      ${rejectionReason ? `
      <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #721c24;">
          <strong>Reason for Rejection:</strong><br>
          ${rejectionReason}
        </p>
      </div>
      ` : ''}

      <p>If you have any questions or would like to discuss this decision, please contact our customer support team. We're here to help!</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}/contact" class="button">Contact Support</a>
      </div>

      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Return Refund Processed Email
const returnRefundProcessed = (order, returnRequest) => {
    const content = `
    <div class="content">
      <h2 style="color: #28a745;">Refund Processed Successfully 💰</h2>
      <p>Hi <strong>${order.user?.name}</strong>,</p>
      <p>Your refund for order <strong>#${order.orderNumber}</strong> has been processed successfully!</p>
      
      <div class="order-details">
        <h3 style="margin-top: 0;">Refund Details</h3>
        <p><strong>Order Number:</strong> #${order.orderNumber}</p>
        <p><strong>Refund Amount:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Refund Date:</strong> ${new Date(returnRequest.refundedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Payment Method:</strong> ${order.payment?.method === 'stripe' ? 'Prepaid (Card/Online)' : 'Cash on Delivery (COD)'}</p>
        <p><strong>Status:</strong> <span class="status-badge status-delivered">Refunded</span></p>
      </div>

      <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #155724;">
          <strong>✅ Refund Complete:</strong><br>
          ${order.payment?.method === 'stripe'
            ? 'The refund has been credited to your original payment method. It may take 5-10 business days to appear in your account depending on your bank or card issuer.'
            : 'The refund will be transferred to your bank account via ACH transfer within 3-5 business days.'}
        </p>
      </div>

      ${order.payment?.method === 'cod' && returnRequest.bankDetails ? `
      <div class="order-details">
        <h3 style="margin-top: 0;">Bank Account Details (Refund Destination)</h3>
        <p><strong>Account Holder:</strong> ${returnRequest.bankDetails.accountHolderName}</p>
        <p><strong>Bank Name:</strong> ${returnRequest.bankDetails.bankName}</p>
        <p><strong>Account Type:</strong> ${returnRequest.bankDetails.accountType.charAt(0).toUpperCase() + returnRequest.bankDetails.accountType.slice(1)}</p>
        <p><strong>Account Number:</strong> ****${returnRequest.bankDetails.accountNumber.slice(-4)}</p>
        <p><strong>Routing Number:</strong> ${returnRequest.bankDetails.routingNumber}</p>
      </div>
      ` : ''}

      ${order.payment?.method === 'stripe' && order.refunds && order.refunds.length > 0 && order.refunds[order.refunds.length - 1].stripeRefundId ? `
      <div class="order-details">
        <h3 style="margin-top: 0;">Refund Transaction Details</h3>
        <p><strong>Refund ID:</strong> ${order.refunds[order.refunds.length - 1].stripeRefundId}</p>
        <p style="color: #6c757d; font-size: 14px;">You can reference this ID if you need to contact your bank or card issuer.</p>
      </div>
      ` : ''}

      <div class="order-details">
        <h3 style="margin-top: 0;">Returned Items</h3>
        ${order.items.map(item => `
          <div style="border-bottom: 1px solid #e9ecef; padding: 10px 0;">
            <p style="margin: 5px 0;"><strong>${item.product?.name || 'Product'}</strong></p>
            <p style="margin: 5px 0; color: #6c757d;">Quantity: ${item.quantity} × $${item.price.toFixed(2)}</p>
          </div>
        `).join('')}
      </div>

      <p>Thank you for your patience throughout this process. We hope to serve you again in the future!</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL}" class="button">Continue Shopping</a>
      </div>

      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
    return baseTemplate(content);
};

// Password Reset OTP Email
const passwordResetOTP = (name, otp) => {
  const content = `
    <div class="content">
      <h2 style="color: #333;">Reset Your Password 🔑</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>We received a request to reset your password. Use the following One-Time Password (OTP) to reset your password:</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px 50px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
          <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>
      </div>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Important:</strong> This OTP is valid for <strong>15 minutes</strong> only. Do not share this code with anyone.
        </p>
      </div>
      
      <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
  return baseTemplate(content);
};

// Login OTP Email
const loginOTP = (name, otp) => {
  const content = `
    <div class="content">
      <h2 style="color: #333;">Your Login Code 🔐</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Use the following One-Time Password (OTP) to login to your account:</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px 50px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
          <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 12px; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>
      </div>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404;">
          <strong>⚠️ Important:</strong> This OTP is valid for <strong>15 minutes</strong> only. Do not share this code with anyone.
        </p>
      </div>
      
      <p>If you didn't request this login code, please secure your account immediately by changing your password.</p>
      
      <p>Best regards,<br><strong>The CanaGold Beauty Team</strong></p>
    </div>
  `;
  return baseTemplate(content);
};

module.exports = {
    welcomeEmail,
    loginNotification,
    orderConfirmation,
    orderStatusUpdate,
    orderTracking,
    otpVerificationEmail,
    orderCancellation,
    returnRequestSubmitted,
    returnRequestApproved,
    returnRequestRejected,
    returnRefundProcessed,
    passwordResetOTP,
    loginOTP
};
