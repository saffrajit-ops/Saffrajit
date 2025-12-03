const { sendEmail } = require('../services/emailService');
const {
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
} = require('../templates/emailTemplates');

// Send welcome email
const sendWelcomeEmail = async (user) => {
  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to CanaGold Beauty! 🎉',
      html: welcomeEmail(user.name)
    });
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};

// Send login notification
const sendLoginNotification = async (user, ipAddress) => {
  try {
    const loginTime = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await sendEmail({
      to: user.email,
      subject: 'New Login to Your Account 🔐',
      html: loginNotification(user.name, loginTime, ipAddress || 'Unknown')
    });
    console.log(`Login notification sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send login notification:', error);
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  try {
    await sendEmail({
      to: order.user?.email,
      subject: `Order Confirmation - #${order.orderNumber} 🎉`,
      html: orderConfirmation(order)
    });
    console.log(`Order confirmation sent to ${order.user?.email}`);
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
  }
};

// Send order status update email
const sendOrderStatusEmail = async (order, oldStatus, newStatus) => {
  try {
    await sendEmail({
      to: order.user?.email,
      subject: `Order #${order.orderNumber} - Status Updated to ${newStatus.toUpperCase()} 📦`,
      html: orderStatusUpdate(order, oldStatus, newStatus)
    });
    console.log(`Order status email sent to ${order.user?.email}`);
  } catch (error) {
    console.error('Failed to send order status email:', error);
  }
};

// Send order tracking email
const sendOrderTrackingEmail = async (order) => {
  try {
    await sendEmail({
      to: order.user?.email,
      subject: `Track Your Order - #${order.orderNumber} 📍`,
      html: orderTracking(order)
    });
    console.log(`Order tracking email sent to ${order.user?.email}`);
  } catch (error) {
    console.error('Failed to send order tracking email:', error);
  }
};

// Send OTP verification email
const sendOTPEmail = async (email, name, otp) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - Cana Gold 🔐',
      html: otpVerificationEmail(name, otp)
    });
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw error;
  }
};

// Send order cancellation email
const sendOrderCancellationEmail = async (order, reason) => {
  try {
    await sendEmail({
      to: order.user?.email,
      subject: `Order Cancelled - #${order.orderNumber} ❌`,
      html: orderCancellation(order, reason)
    });
    console.log(`Order cancellation email sent to ${order.user?.email}`);
  } catch (error) {
    console.error('Failed to send order cancellation email:', error);
  }
};

// Send return request submitted email
const sendReturnRequestEmail = async (order, returnRequest) => {
  try {
    await sendEmail({
      to: order.user?.email,
      subject: `Return Request Received - #${order.orderNumber} 📦`,
      html: returnRequestSubmitted(order, returnRequest)
    });
    console.log(`Return request email sent to ${order.user?.email}`);
  } catch (error) {
    console.error('Failed to send return request email:', error);
  }
};

// Send return request approved email
const sendReturnApprovedEmail = async (order, returnRequest) => {
  try {
    await sendEmail({
      to: order.user?.email,
      subject: `Return Request Approved - #${order.orderNumber} ✅`,
      html: returnRequestApproved(order, returnRequest)
    });
    console.log(`Return approved email sent to ${order.user?.email}`);
  } catch (error) {
    console.error('Failed to send return approved email:', error);
  }
};

// Send return request rejected email
const sendReturnRejectedEmail = async (order, returnRequest, rejectionReason) => {
  try {
    await sendEmail({
      to: order.user?.email,
      subject: `Return Request Declined - #${order.orderNumber} ❌`,
      html: returnRequestRejected(order, returnRequest, rejectionReason)
    });
    console.log(`Return rejected email sent to ${order.user?.email}`);
  } catch (error) {
    console.error('Failed to send return rejected email:', error);
  }
};

// Send return refund processed email
const sendReturnRefundEmail = async (order, returnRequest) => {
  try {
    await sendEmail({
      to: order.user?.email,
      subject: `Refund Processed - #${order.orderNumber} 💰`,
      html: returnRefundProcessed(order, returnRequest)
    });
    console.log(`Return refund email sent to ${order.user?.email}`);
  } catch (error) {
    console.error('Failed to send return refund email:', error);
  }
};

// Send password reset OTP email
const sendPasswordResetOTP = async (email, name, otp) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Reset Your Password - Cana Gold 🔑',
      html: passwordResetOTP(name, otp)
    });
    console.log(`Password reset OTP sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset OTP:', error);
    throw error;
  }
};

// Send login OTP email
const sendLoginOTP = async (email, name, otp) => {
  try {
    await sendEmail({
      to: email,
      subject: 'Your Login Code - Cana Gold 🔐',
      html: loginOTP(name, otp)
    });
    console.log(`Login OTP sent to ${email}`);
  } catch (error) {
    console.error('Failed to send login OTP:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendLoginNotification,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendOrderTrackingEmail,
  sendOTPEmail,
  sendOrderCancellationEmail,
  sendReturnRequestEmail,
  sendReturnApprovedEmail,
  sendReturnRejectedEmail,
  sendReturnRefundEmail,
  sendPasswordResetOTP,
  sendLoginOTP
};
