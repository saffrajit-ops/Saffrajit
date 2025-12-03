const HeroSection = require('../models/heroSection.model');
const { uploadVideo, deleteVideo } = require('../config/cloudinary');

class HeroSectionController {
  // Get hero section (Public)
  async getHeroSection(req, res) {
    try {
      const heroSection = await HeroSection.findOne({ isActive: true });
      
      if (!heroSection) {
        return res.status(404).json({
          success: false,
          message: 'Hero section not found',
        });
      }

      res.status(200).json({
        success: true,
        data: heroSection,
      });
    } catch (error) {
      console.error('Get hero section error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hero section',
        error: error.message,
      });
    }
  }

  // Get hero section for admin
  async getHeroSectionAdmin(req, res) {
    try {
      let heroSection = await HeroSection.findOne();
      
      // If no hero section exists, create a default one
      if (!heroSection) {
        heroSection = await HeroSection.create({
          title: 'Luxury Redefined',
          subtitle: 'WHERE NATURE MEETS SCIENCE',
          description: 'Experience the power of 24K Nano Gold and nature\'s finest ingredients',
          buttonText: 'DISCOVER COLLECTION',
          buttonLink: '/skincare',
          video: {
            url: '/video1.mp4',
            publicId: 'default',
          },
          isActive: true,
        });
      }

      res.status(200).json({
        success: true,
        data: heroSection,
      });
    } catch (error) {
      console.error('Get hero section admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hero section',
        error: error.message,
      });
    }
  }

  // Update hero section (Admin only)
  async updateHeroSection(req, res) {
    try {
      const { title, subtitle, description, buttonText, buttonLink, isActive } = req.body;
      
      let heroSection = await HeroSection.findOne();
      
      if (!heroSection) {
        return res.status(404).json({
          success: false,
          message: 'Hero section not found',
        });
      }

      // Handle video upload if provided
      if (req.file) {
        // Delete old video from Cloudinary if it exists
        if (heroSection.video?.publicId && heroSection.video.publicId !== 'default') {
          try {
            await deleteVideo(heroSection.video.publicId);
          } catch (error) {
            console.error('Error deleting old video:', error);
          }
        }

        // Upload new video to Cloudinary using buffer (same as images)
        const result = await uploadVideo(req.file.buffer, {
          folder: 'hero-section'
        });

        heroSection.video = {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          duration: result.duration,
          format: result.format,
        };
      }

      // Update text fields
      if (title) heroSection.title = title;
      if (subtitle) heroSection.subtitle = subtitle;
      if (description) heroSection.description = description;
      if (buttonText) heroSection.buttonText = buttonText;
      if (buttonLink) heroSection.buttonLink = buttonLink;
      if (typeof isActive !== 'undefined') heroSection.isActive = isActive;

      await heroSection.save();

      res.status(200).json({
        success: true,
        message: 'Hero section updated successfully',
        data: heroSection,
      });
    } catch (error) {
      console.error('Update hero section error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update hero section',
        error: error.message,
      });
    }
  }
}

module.exports = new HeroSectionController();
