const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const commentSchema = new mongoose.Schema({
  blog: mongoose.Schema.Types.ObjectId,
  content: String,
  author: {
    name: String,
    email: String,
    userId: mongoose.Schema.Types.ObjectId
  },
  likes: [mongoose.Schema.Types.ObjectId],
  replies: [mongoose.Schema.Types.Mixed],
  status: String,
  createdAt: Date,
  updatedAt: Date
}, { strict: false });

const Comment = mongoose.model('Comment', commentSchema);

async function migrateCommentStatus() {
  try {
    console.log('Starting comment status migration...');
    
    // Update all comments with 'pending' status to 'approved'
    const result = await Comment.updateMany(
      { status: 'pending' },
      { $set: { status: 'approved' } }
    );
    
    console.log(`✅ Migration completed!`);
    console.log(`   Updated ${result.modifiedCount} comments from 'pending' to 'approved'`);
    
    // Show current status distribution
    const approved = await Comment.countDocuments({ status: 'approved' });
    const rejected = await Comment.countDocuments({ status: 'rejected' });
    const other = await Comment.countDocuments({ status: { $nin: ['approved', 'rejected'] } });
    
    console.log('\nCurrent status distribution:');
    console.log(`   Approved: ${approved}`);
    console.log(`   Rejected: ${rejected}`);
    console.log(`   Other: ${other}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateCommentStatus();
