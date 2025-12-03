require('dotenv').config();
const mongoose = require('mongoose');
const CompanyInfo = require('../src/models/companyInfo.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedCompanyInfo = async () => {
  try {
    console.log('🚀 Starting company info seed...\n');
    
    await connectDB();

    const exists = await CompanyInfo.findOne();
    
    if (exists) {
      console.log('⏭️  Company info already exists, skipping...');
      process.exit(0);
      return;
    }

    await CompanyInfo.create({
      phone: '+1 7472837766',
      email: 'info@canagoldbeauty.com',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      socialMedia: {
        facebook: 'https://www.facebook.com/CanaGoldBeauty/',
        instagram: 'https://www.instagram.com/canagoldbeauty/',
        twitter: 'https://twitter.com/CanaGoldBeauty',
        linkedin: 'https://www.linkedin.com/company/cana-gold/',
        pinterest: 'https://www.pinterest.com/CanaGoldBeauty/',
        youtube: '',
      },
      companyName: 'CANAGOLD',
      tagline: 'Luxury Skincare with 24K Gold',
      description: 'Premium skincare products featuring 24K Nano Gold and natural ingredients.',
      foundedYear: 2009,
      copyrightText: '© 2009 - 2022 CANAGOLD. ALL RIGHTS RESERVED. WEBSITE BY FIXL SOLUTIONS.',
      newsletterTitle: 'SIGN UP & SAVE',
      newsletterDescription: 'Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.',
    });

    console.log('✅ Company info created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
};

seedCompanyInfo();
