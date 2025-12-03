const LuxuryShowcase = require('../models/luxuryShowcase.model');
const { uploadVideo, deleteVideo } = require('../config/cloudinary');

class LuxuryShowcaseController {
  // Get luxury showcase (Public)
  async getLuxuryShowcase(req, res) {
    try {
      const luxuryShowcase = await LuxuryShowcase.findOne({ isActive: true });
      
      if (!luxuryShowcase) {
        return res.status(404).json({
          success: false,
          message: 'Luxury showcase not found',
        });
      }

      res.status(200).json({
        success: true,
        data: luxuryShowcase,
      });
    } catch (error) {
      console.error('Get luxury showcase error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch luxury showcase',
        error: error.message,
      });
    }
  }

  // Get luxury showcase for admin
  async getLuxuryShowcaseAdmin(req, res) {
    try {
      let luxuryShowcase = await LuxuryShowcase.findOne();
      
      // If no luxury showcase exists, create a default one
      if (!luxuryShowcase) {
        luxuryShowcase = await LuxuryShowcase.create({
          title: 'The Perfect Gift',
          subtitle: 'LUXURY GIFT SETS',
          description: 'Curated collections featuring 24K Gold & Caviar treatments, from daily rejuvenation to overnight luxury and instant lifting solutions',
          buttonText: 'EXPLORE GIFT SETS',
          buttonLink: '/gifts',
          video: {
            url: '/video2.mp4',
            publicId: 'default',
          },
          isActive: true,
        });
      }

      res.status(200).json({
        success: true,
        data: luxuryShowcase,
      });
    } catch (error) {
      console.error('Get luxury showcase admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch luxury showcase',
        error: error.message,
      });
    }
  }

  // Update luxury showcase (Admin only)
  async updateLuxuryShowcase(req, res) {
    try {
      const { title, subtitle, description, buttonText, buttonLink, isActive } = req.body;
      
      let luxuryShowcase = await LuxuryShowcase.findOne();
      
      if (!luxuryShowcase) {
        return res.status(404).json({
          success: false,
          message: 'Luxury showcase not found',
        });
      }

      // Handle video upload if provided
      if (req.file) {
        // Delete old video from Cloudinary if it exists
        if (luxuryShowcase.video?.publicId && luxuryShowcase.video.publicId !== 'default') {
          try {
            await deleteVideo(luxuryShowcase.video.publicId);
          } catch (error) {
            console.error('Error deleting old video:', error);
          }
        }

        // Upload new video to Cloudinary using buffer (same as images)
        const result = await uploadVideo(req.file.buffer, {
          folder: 'luxury-showcase'
        });

        luxuryShowcase.video = {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          duration: result.duration,
          format: result.format,
        };
      }

      // Update text fields
      if (title) luxuryShowcase.title = title;
      if (subtitle) luxuryShowcase.subtitle = subtitle;
      if (description) luxuryShowcase.description = description;
      if (buttonText) luxuryShowcase.buttonText = buttonText;
      if (buttonLink) luxuryShowcase.buttonLink = buttonLink;
      if (typeof isActive !== 'undefined') luxuryShowcase.isActive = isActive;

      await luxuryShowcase.save();

      res.status(200).json({
        success: true,
        message: 'Luxury showcase updated successfully',
        data: luxuryShowcase,
      });
    } catch (error) {
      console.error('Update luxury showcase error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update luxury showcase',
        error: error.message,
      });
    }
  }
}

module.exports = new LuxuryShowcaseController();
