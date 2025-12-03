/**
 * Script to fix the review unique index
 * Run this once to update the database index
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixReviewIndex() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const reviewsCollection = db.collection('reviews');

        // Get current indexes
        console.log('\n📋 Current indexes:');
        const indexes = await reviewsCollection.indexes();
        indexes.forEach(index => {
            console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
        });

        // Drop the old unique index on { order: 1, product: 1 }
        console.log('\n🗑️  Dropping old index { order: 1, product: 1 }...');
        try {
            await reviewsCollection.dropIndex('order_1_product_1');
            console.log('✅ Old index dropped');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  Index does not exist (already dropped or never created)');
            } else {
                throw error;
            }
        }

        // Create new unique index on { order: 1, product: 1, user: 1 }
        console.log('\n➕ Creating new index { order: 1, product: 1, user: 1 }...');
        await reviewsCollection.createIndex(
            { order: 1, product: 1, user: 1 },
            { unique: true, name: 'order_1_product_1_user_1' }
        );
        console.log('✅ New index created');

        // Verify new indexes
        console.log('\n📋 Updated indexes:');
        const newIndexes = await reviewsCollection.indexes();
        newIndexes.forEach(index => {
            console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
        });

        console.log('\n✅ Index migration completed successfully!');
        console.log('\n📝 What this means:');
        console.log('  ✅ Users can now review the same product from different orders');
        console.log('  ✅ Users cannot review the same product twice from the same order');
        console.log('  ✅ Each user can have multiple reviews for the same product (from different orders)');

        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

fixReviewIndex();
