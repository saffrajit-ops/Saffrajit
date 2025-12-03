import jsPDF from 'jspdf';

interface OrderItem {
  product?: {
    title?: string;
    images?: Array<{ url: string }>;
  };
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface ShippingAddress {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface StatusHistory {
  status: string;
  changedTo: string;
  changedAt: string;
  notes?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  subtotal: number;
  discount?: number;
  shippingCharges?: number;
  total: number;
  coupon?: {
    code?: string;
    discount?: number;
  };
  payment?: {
    method?: string;
    status?: string;
    paidAt?: string;
  };
  createdAt: string;
  status: string;
  confirmedAt?: string;
  processing?: {
    startedAt?: string;
    notes?: string;
  };
  shipping?: {
    shippedAt?: string;
    trackingNumber?: string;
    notes?: string;
  };
  delivery?: {
    deliveredAt?: string;
    notes?: string;
  };
  cancellation?: {
    reason?: string;
    cancelledAt?: string;
  };
  return?: {
    status?: string;
    reason?: string;
    requestedAt?: string;
    approvedAt?: string;
    rejectedAt?: string;
    notes?: string;
  };
  refunds?: Array<{
    amount: number;
    reason?: string;
    processedAt?: string;
    status: string;
  }>;
  statusHistory?: StatusHistory[];
}

interface UserInfo {
  name?: string;
  email?: string;
}

export function generateInvoicePDF(order: Order, userInfo?: UserInfo) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Colors
  const primaryColor: [number, number, number] = [0, 0, 0]; // Black
  const secondaryColor: [number, number, number] = [128, 128, 128]; // Gray
  const accentColor: [number, number, number] = [0, 0, 0]; // Black

  // Header with Cana Gold branding
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CANA GOLD', margin, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Premium Skincare & Beauty', margin, 35);

  yPos = 60;

  // Invoice title
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' });

  yPos += 15;

  // Order details section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.text(`Order Number: ${order.orderNumber}`, margin, yPos);
  doc.text(`Date: ${orderDate}`, margin, yPos + 5);
  doc.text(`Status: ${order.status.toUpperCase()}`, margin, yPos + 10);

  // Customer info
  const customerX = pageWidth - margin;
  doc.text('Bill To:', customerX, yPos, { align: 'right' });
  if (userInfo?.name) {
    doc.text(userInfo.name, customerX, yPos + 5, { align: 'right' });
  }
  if (userInfo?.email) {
    doc.text(userInfo.email, customerX, yPos + 10, { align: 'right' });
  }

  yPos += 25;

  // Shipping address
  if (order.shippingAddress) {
    doc.setFont('helvetica', 'bold');
    doc.text('Shipping Address:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    doc.text(order.shippingAddress.line1, margin, yPos);
    yPos += 5;
    if (order.shippingAddress.line2) {
      doc.text(order.shippingAddress.line2, margin, yPos);
      yPos += 5;
    }
    doc.text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`,
      margin,
      yPos
    );
    yPos += 5;
    doc.text(order.shippingAddress.country, margin, yPos);
    yPos += 10;
  }

  // Line separator
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Items table header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item', margin, yPos);
  doc.text('Quantity', margin + 80, yPos);
  doc.text('Price', margin + 120, yPos);
  doc.text('Subtotal', pageWidth - margin, yPos, { align: 'right' });

  yPos += 5;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  order.items.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    const itemTitle = item.title || item.product?.title || 'Product';
    const lines = doc.splitTextToSize(itemTitle, 60);

    lines.forEach((line: string, lineIndex: number) => {
      doc.text(line, margin, yPos + (lineIndex * 5));
    });

    const itemHeight = Math.max(lines.length * 5, 10);
    doc.text(item.quantity.toString(), margin + 80, yPos);
    doc.text(`$${item.price.toFixed(2)}`, margin + 120, yPos);
    doc.text(`$${item.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });

    yPos += itemHeight + 3;
  });

  yPos += 5;
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Totals section
  const totalsX = pageWidth - margin;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX - 50, yPos, { align: 'right' });
  doc.text(`$${order.subtotal.toFixed(2)}`, totalsX, yPos, { align: 'right' });
  yPos += 7;

  if (order.discount && order.discount > 0) {
    doc.text('Product Discount:', totalsX - 50, yPos, { align: 'right' });
    doc.text(`-$${order.discount.toFixed(2)}`, totalsX, yPos, { align: 'right' });
    yPos += 7;
  }

  if (order.coupon?.discount && order.coupon.discount > 0) {
    doc.text(`Coupon (${order.coupon.code || 'Coupon'}):`, totalsX - 50, yPos, { align: 'right' });
    doc.text(`-$${order.coupon.discount.toFixed(2)}`, totalsX, yPos, { align: 'right' });
    yPos += 7;
  }

  if (order.shippingCharges !== undefined) {
    doc.text('Shipping:', totalsX - 50, yPos, { align: 'right' });
    doc.text(order.shippingCharges === 0 ? 'FREE' : `$${order.shippingCharges.toFixed(2)}`, totalsX, yPos, { align: 'right' });
    yPos += 7;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', totalsX - 50, yPos, { align: 'right' });
  doc.text(`$${order.total.toFixed(2)}`, totalsX, yPos, { align: 'right' });
  yPos += 15;

  // Payment info
  if (order.payment) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Payment Method: ${order.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}`, margin, yPos);
    yPos += 5;
    doc.text(`Payment Status: ${order.payment.status?.toUpperCase() || 'PENDING'}`, margin, yPos);
    yPos += 5;
    if (order.payment.paidAt) {
      doc.text(`Paid At: ${new Date(order.payment.paidAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, margin, yPos);
      yPos += 5;
    }
    yPos += 5;
  }

  // Tracking Information
  if (order.shipping?.trackingNumber) {
    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Tracking Information', margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Tracking Number: ${order.shipping.trackingNumber}`, margin, yPos);
    yPos += 5;
    
    if (order.shipping.shippedAt) {
      doc.text(`Shipped At: ${new Date(order.shipping.shippedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, margin, yPos);
      yPos += 5;
    }

    if (order.shipping.notes) {
      doc.text(`Notes: ${order.shipping.notes}`, margin, yPos);
      yPos += 5;
    }
    yPos += 5;
  }

  // Delivery Information
  if (order.delivery?.deliveredAt) {
    if (yPos > pageHeight - 70) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Delivery Information', margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Delivered At: ${new Date(order.delivery.deliveredAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, margin, yPos);
    yPos += 5;

    if (order.delivery.notes) {
      doc.text(`Notes: ${order.delivery.notes}`, margin, yPos);
      yPos += 5;
    }
    yPos += 5;
  }

  // Order Activity Timeline
  if (order.statusHistory && order.statusHistory.length > 0) {
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Order Activity Timeline', margin, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Add order creation
    doc.text(`• Order Created`, margin + 5, yPos);
    doc.text(new Date(order.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }), pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;

    // Add confirmed
    if (order.confirmedAt) {
      doc.text(`• Order Confirmed`, margin + 5, yPos);
      doc.text(new Date(order.confirmedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    // Add processing
    if (order.processing?.startedAt) {
      doc.text(`• Processing Started`, margin + 5, yPos);
      doc.text(new Date(order.processing.startedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
      if (order.processing.notes) {
        const notesLines = doc.splitTextToSize(`  ${order.processing.notes}`, pageWidth - margin * 2 - 10);
        notesLines.forEach((line: string) => {
          doc.text(line, margin + 10, yPos);
          yPos += 4;
        });
        yPos += 1;
      }
    }

    // Add shipped
    if (order.shipping?.shippedAt) {
      doc.text(`• Order Shipped`, margin + 5, yPos);
      doc.text(new Date(order.shipping.shippedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    // Add delivered
    if (order.delivery?.deliveredAt) {
      doc.text(`• Order Delivered`, margin + 5, yPos);
      doc.text(new Date(order.delivery.deliveredAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    // Add cancellation
    if (order.cancellation?.cancelledAt) {
      doc.setTextColor(200, 0, 0);
      doc.text(`• Order Cancelled`, margin + 5, yPos);
      doc.text(new Date(order.cancellation.cancelledAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
      if (order.cancellation.reason) {
        const reasonLines = doc.splitTextToSize(`  Reason: ${order.cancellation.reason}`, pageWidth - margin * 2 - 10);
        reasonLines.forEach((line: string) => {
          doc.text(line, margin + 10, yPos);
          yPos += 4;
        });
        yPos += 1;
      }
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    }

    // Add return info
    if (order.return?.requestedAt) {
      doc.setTextColor(0, 0, 200);
      doc.text(`• Return Requested`, margin + 5, yPos);
      doc.text(new Date(order.return.requestedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }), pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
      if (order.return.reason) {
        const reasonLines = doc.splitTextToSize(`  Reason: ${order.return.reason}`, pageWidth - margin * 2 - 10);
        reasonLines.forEach((line: string) => {
          doc.text(line, margin + 10, yPos);
          yPos += 4;
        });
        yPos += 1;
      }

      if (order.return.approvedAt) {
        doc.text(`• Return Approved`, margin + 5, yPos);
        doc.text(new Date(order.return.approvedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }), pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
      }

      if (order.return.rejectedAt) {
        doc.setTextColor(200, 0, 0);
        doc.text(`• Return Rejected`, margin + 5, yPos);
        doc.text(new Date(order.return.rejectedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }), pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
      }
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    }

    // Add refunds
    if (order.refunds && order.refunds.length > 0) {
      order.refunds.forEach((refund) => {
        doc.setTextColor(0, 150, 0);
        doc.text(`• Refund Processed: $${refund.amount.toFixed(2)}`, margin + 5, yPos);
        if (refund.processedAt) {
          doc.text(new Date(refund.processedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }), pageWidth - margin, yPos, { align: 'right' });
        }
        yPos += 5;
        if (refund.reason) {
          const reasonLines = doc.splitTextToSize(`  Reason: ${refund.reason}`, pageWidth - margin * 2 - 10);
          reasonLines.forEach((line: string) => {
            doc.text(line, margin + 10, yPos);
            yPos += 4;
          });
          yPos += 1;
        }
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      });
    }

    yPos += 5;
  }

  // Footer
  yPos = pageHeight - 30;
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('Thank you for your purchase!', pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text('For inquiries, please contact our customer service.', pageWidth / 2, yPos, { align: 'center' });

  // Save PDF
  doc.save(`invoice-${order.orderNumber}.pdf`);
}
