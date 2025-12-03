const Newsletter = require('../models/newsletter.model');

class NewsletterController {
  // Subscribe to newsletter (Public)
  async subscribe(req, res) {
    try {
      const { email, source = 'footer' } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      // Check if email already exists
      const existingSubscriber = await Newsletter.findOne({ email });

      if (existingSubscriber) {
        if (existingSubscriber.status === 'subscribed' || existingSubscriber.status === 'pending') {
          return res.status(400).json({
            success: false,
            message: 'This email is already subscribed',
          });
        } else {
          // Reactivate subscription
          existingSubscriber.status = 'subscribed';
          existingSubscriber.subscribedAt = new Date();
          existingSubscriber.unsubscribedAt = undefined;
          existingSubscriber.source = source;
          await existingSubscriber.save();

          return res.status(200).json({
            success: true,
            message: 'Successfully resubscribed to newsletter',
            data: existingSubscriber,
          });
        }
      }

      // Create new subscriber
      const subscriber = await Newsletter.create({
        email,
        source,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to newsletter',
        data: subscriber,
      });
    } catch (error) {
      console.error('Newsletter subscribe error:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to subscribe to newsletter',
        error: error.message,
      });
    }
  }

  // Unsubscribe from newsletter (Public)
  async unsubscribe(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const subscriber = await Newsletter.findOne({ email });

      if (!subscriber) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in our newsletter list',
        });
      }

      if (subscriber.status === 'unsubscribed') {
        return res.status(400).json({
          success: false,
          message: 'This email is already unsubscribed',
        });
      }

      subscriber.status = 'unsubscribed';
      subscriber.unsubscribedAt = new Date();
      await subscriber.save();

      res.status(200).json({
        success: true,
        message: 'Successfully unsubscribed from newsletter',
      });
    } catch (error) {
      console.error('Newsletter unsubscribe error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsubscribe from newsletter',
        error: error.message,
      });
    }
  }

  // Get all subscribers (Admin)
  async getAllSubscribers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const query = {};

      // Filter by status
      if (status && ['pending', 'subscribed', 'unsubscribed', 'bounced'].includes(status)) {
        query.status = status;
      }

      // Search by email
      if (search) {
        query.email = { $regex: search, $options: 'i' };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [subscribers, total] = await Promise.all([
        Newsletter.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Newsletter.countDocuments(query),
      ]);

      // Get stats
      const stats = await Newsletter.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const statsObj = {
        total: total,
        pending: stats.find(s => s._id === 'pending')?.count || 0,
        subscribed: stats.find(s => s._id === 'subscribed')?.count || 0,
        unsubscribed: stats.find(s => s._id === 'unsubscribed')?.count || 0,
        bounced: stats.find(s => s._id === 'bounced')?.count || 0,
      };

      res.status(200).json({
        success: true,
        data: subscribers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
        stats: statsObj,
      });
    } catch (error) {
      console.error('Get subscribers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subscribers',
        error: error.message,
      });
    }
  }

  // Update subscriber status (Admin)
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'subscribed', 'unsubscribed', 'bounced'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "pending", "subscribed", "unsubscribed", or "bounced"',
        });
      }

      const subscriber = await Newsletter.findById(id);

      if (!subscriber) {
        return res.status(404).json({
          success: false,
          message: 'Subscriber not found',
        });
      }

      subscriber.status = status;
      if (status === 'unsubscribed') {
        subscriber.unsubscribedAt = new Date();
      } else {
        subscriber.unsubscribedAt = undefined;
        subscriber.subscribedAt = new Date();
      }

      await subscriber.save();

      res.status(200).json({
        success: true,
        message: 'Subscriber status updated successfully',
        data: subscriber,
      });
    } catch (error) {
      console.error('Update subscriber status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subscriber status',
        error: error.message,
      });
    }
  }

  // Delete subscriber (Admin)
  async deleteSubscriber(req, res) {
    try {
      const { id } = req.params;

      const subscriber = await Newsletter.findByIdAndDelete(id);

      if (!subscriber) {
        return res.status(404).json({
          success: false,
          message: 'Subscriber not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Subscriber deleted successfully',
      });
    } catch (error) {
      console.error('Delete subscriber error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subscriber',
        error: error.message,
      });
    }
  }

  // Bulk delete subscribers (Admin)
  async bulkDelete(req, res) {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of subscriber IDs',
        });
      }

      const result = await Newsletter.deleteMany({
        _id: { $in: ids },
      });

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} subscriber(s)`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subscribers',
        error: error.message,
      });
    }
  }

  // Export subscribers (Admin)
  async exportSubscribers(req, res) {
    try {
      const { status } = req.query;
      const query = {};

      if (status && ['pending', 'subscribed', 'unsubscribed', 'bounced'].includes(status)) {
        query.status = status;
      }

      const subscribers = await Newsletter.find(query)
        .select('email status source subscribedAt unsubscribedAt createdAt')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: subscribers,
        count: subscribers.length,
      });
    } catch (error) {
      console.error('Export subscribers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export subscribers',
        error: error.message,
      });
    }
  }
}

module.exports = new NewsletterController();
