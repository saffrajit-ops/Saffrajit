#!/bin/bash

echo "📧 Installing Email System..."
echo ""

# Install nodemailer
npm install nodemailer

echo ""
echo "✅ Installation Complete!"
echo ""
echo "📝 Next Steps:"
echo "  1. Get Gmail App Password:"
echo "     - Enable 2FA: https://myaccount.google.com/security"
echo "     - Generate App Password: https://myaccount.google.com/apppasswords"
echo ""
echo "  2. Update backend/.env file:"
echo "     EMAIL_USER=your-email@gmail.com"
echo "     EMAIL_PASSWORD=your-16-char-app-password"
echo ""
echo "  3. Restart your backend server"
echo ""
echo "  4. Test by creating an account or placing an order!"
echo ""
echo "📖 See EMAIL_SETUP_GUIDE.md for detailed instructions"
echo ""
