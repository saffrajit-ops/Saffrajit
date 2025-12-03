const CompanyInfo = require('../models/companyInfo.model');

class CompanyInfoController {
  // Get company info (Public)
  async getCompanyInfo(req, res) {
    try {
      const companyInfo = await CompanyInfo.findOne();
      
      if (!companyInfo) {
        return res.status(404).json({
          success: false,
          message: 'Company information not found',
        });
      }

      res.status(200).json({
        success: true,
        data: companyInfo,
      });
    } catch (error) {
      console.error('Get company info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch company information',
        error: error.message,
      });
    }
  }

  // Get company info for admin
  async getCompanyInfoAdmin(req, res) {
    try {
      let companyInfo = await CompanyInfo.findOne();
      
      // If no company info exists, create default one
      if (!companyInfo) {
        companyInfo = await CompanyInfo.create({
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
          foundedYear: 2009,
        });
      }

      res.status(200).json({
        success: true,
        data: companyInfo,
      });
    } catch (error) {
      console.error('Get company info admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch company information',
        error: error.message,
      });
    }
  }

  // Update company info (Admin only)
  async updateCompanyInfo(req, res) {
    try {
      const updateData = req.body;
      
      let companyInfo = await CompanyInfo.findOne();
      
      if (!companyInfo) {
        // Create new if doesn't exist
        companyInfo = await CompanyInfo.create(updateData);
      } else {
        // Update existing
        Object.assign(companyInfo, updateData);
        await companyInfo.save();
      }

      res.status(200).json({
        success: true,
        message: 'Company information updated successfully',
        data: companyInfo,
      });
    } catch (error) {
      console.error('Update company info error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update company information',
        error: error.message,
      });
    }
  }
}

module.exports = new CompanyInfoController();
