/**
 * Script to generate Excel template for bulk blog upload
 * Run: node scripts/generate-blog-bulk-upload-template.js
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Template headers
const headers = [
  'title',
  'slug',
  'excerpt',
  'content',
  'category',
  'tags',
  'authorName',
  'authorEmail',
  'featuredImage',
  'isPublished',
  'publishedAt',
  'metaTitle',
  'metaDescription',
  'metaKeywords'
];

// Sample data rows with realistic blog content
const sampleData = [
  {
    title: 'The Science Behind 24K Gold in Skincare',
    slug: 'science-behind-24k-gold-skincare',
    excerpt: 'Discover the scientific benefits of 24K gold and why it has become a coveted ingredient in luxury skincare products.',
    content: 'Gold has been treasured for centuries, not just for its beauty but for its remarkable skincare benefits. Modern science has validated what ancient civilizations knew: 24K gold can transform your skin. Gold nanoparticles stimulate cellular growth and regeneration, helping to reduce the appearance of fine lines and wrinkles. Studies show that gold can slow down collagen depletion and increase skin elasticity. Gold ions help to activate the basal cells of the skin, which increases firmness and results in a natural, healthy glow. Gold also has natural anti-inflammatory properties that can help reduce skin inflammation, redness, and protect against free radicals that cause premature aging. For best results, incorporate gold-infused serums and creams into your daily routine. Apply after cleansing and before moisturizing for maximum absorption. Experience the luxury of CanaGold 24K gold-infused skincare collection.',
    category: 'Skincare Science',
    tags: 'gold skincare, anti-aging, luxury beauty, 24k gold, skincare benefits',
    authorName: 'Dr. Sarah Johnson',
    authorEmail: 'sarah@canagold.com',
    featuredImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200',
    isPublished: 'TRUE',
    publishedAt: '2024-11-01',
    metaTitle: 'The Science Behind 24K Gold in Skincare | CanaGold Beauty',
    metaDescription: 'Learn about the scientific benefits of 24K gold in skincare. Discover how gold nanoparticles can transform your skin with anti-aging properties.',
    metaKeywords: '24k gold skincare, gold benefits, anti-aging, luxury skincare, gold nanoparticles'
  },
  {
    title: 'Complete Morning Skincare Routine for Glowing Skin',
    slug: 'complete-morning-skincare-routine-glowing-skin',
    excerpt: 'Start your day right with this comprehensive morning skincare routine designed to give you radiant, healthy-looking skin all day long.',
    content: 'A proper morning skincare routine sets the foundation for beautiful, glowing skin throughout the day. Follow these essential steps for optimal results. Step 1: Begin with a gentle, pH-balanced cleanser to remove overnight oils and impurities. Use lukewarm water and massage in circular motions for 60 seconds. Step 2: Apply a hydrating toner to balance your skin pH and prepare it for better absorption of subsequent products. Pat gently with your fingertips. Step 3: Apply 3-4 drops of vitamin C serum to brighten skin and protect against environmental damage. This powerful antioxidant is essential for morning routines. Step 4: Gently pat eye cream around the orbital bone using your ring finger. This delicate area needs special attention to prevent fine lines and dark circles. Step 5: Lock in hydration with a lightweight, non-comedogenic moisturizer. Choose one with hyaluronic acid for extra hydration. Step 6: Never skip SPF! Apply broad-spectrum SPF 30 or higher as your final step. Reapply every 2 hours if outdoors. Pro Tips: Wait 1-2 minutes between each step for better absorption. Use upward motions when applying products. Do not forget your neck and décolletage. Stay consistent for best results.',
    category: 'Skincare Routine',
    tags: 'morning routine, skincare steps, glowing skin, daily skincare, beauty routine',
    authorName: 'Emma Martinez',
    authorEmail: 'emma@canagold.com',
    featuredImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200',
    isPublished: 'TRUE',
    publishedAt: '2024-11-10',
    metaTitle: 'Complete Morning Skincare Routine for Glowing Skin | CanaGold',
    metaDescription: 'Follow this step-by-step morning skincare routine to achieve radiant, glowing skin. Expert tips and product recommendations included.',
    metaKeywords: 'morning skincare routine, glowing skin, daily skincare, beauty routine, skincare steps'
  }
];

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet from sample data
const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

// Set column widths
const colWidths = headers.map(h => {
  if (h === 'content') return { wch: 80 };
  if (h === 'excerpt' || h === 'metaDescription') return { wch: 60 };
  if (h === 'title' || h === 'slug' || h === 'metaTitle') return { wch: 50 };
  if (h === 'featuredImage') return { wch: 50 };
  if (h === 'tags' || h === 'metaKeywords') return { wch: 40 };
  if (h === 'authorEmail') return { wch: 30 };
  if (h === 'authorName' || h === 'category') return { wch: 25 };
  if (h === 'publishedAt') return { wch: 20 };
  return { wch: 15 };
});
ws['!cols'] = colWidths;

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Blog Posts');

// Ensure docs directory exists
const docsDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// Write file
const outputPath = path.join(docsDir, 'blog-bulk-upload-template.xlsx');
XLSX.writeFile(wb, outputPath);

console.log('✅ Excel template generated successfully!');
console.log(`📁 Location: ${outputPath}`);
console.log('\nTemplate includes:');
console.log('- All required and optional columns');
console.log('- 2 sample blog post rows with complete content');
console.log('- Proper formatting and column widths');
console.log('\nSample posts:');
console.log('1. The Science Behind 24K Gold in Skincare');
console.log('2. Complete Morning Skincare Routine for Glowing Skin');
