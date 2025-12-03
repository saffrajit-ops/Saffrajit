/**
 * Search utility functions for products and orders
 */

/**
 * Build search regex from query string
 * @param {string} query - Search query
 * @param {boolean} exactMatch - Whether to match exact words
 * @returns {RegExp[]} Array of regex patterns
 */
const buildSearchRegex = (query, exactMatch = false) => {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const searchTerms = query.trim().split(/\s+/);
  
  if (exactMatch) {
    return searchTerms.map(term => new RegExp(`\\b${escapeRegex(term)}\\b`, 'i'));
  }
  
  return searchTerms.map(term => new RegExp(escapeRegex(term), 'i'));
};

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Build product search filter
 * @param {string} query - Search query
 * @param {Object} options - Additional filter options
 * @returns {Object} MongoDB filter object
 */
const buildProductSearchFilter = (query, options = {}) => {
  const {
    category,
    type,
    minPrice,
    maxPrice,
    inStock,
    isActive = true,
    brand,
    exactMatch = false
  } = options;

  const filter = {};
  
  // Add active filter for public searches
  if (isActive !== null) {
    filter.isActive = isActive;
  }

  if (query && query.trim()) {
    const searchRegex = buildSearchRegex(query, exactMatch);
    
    filter.$or = [
      { title: { $in: searchRegex } },
      { description: { $in: searchRegex } },
      { brand: { $in: searchRegex } },
      { sku: { $in: searchRegex } },
      { tags: { $in: searchRegex } }
    ];
  }

  // Apply additional filters
  if (category) {
    filter.taxonomies = { $in: Array.isArray(category) ? category : [category] };
  }
  
  if (type) {
    filter.type = type;
  }
  
  if (brand) {
    filter.brand = new RegExp(escapeRegex(brand), 'i');
  }
  
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }
  
  if (inStock === true || inStock === 'true') {
    filter.stock = { $gt: 0 };
  }

  return filter;
};

/**
 * Build order search filter
 * @param {string} query - Search query
 * @param {Array} userIds - Array of user IDs that match user search
 * @param {Object} options - Additional filter options
 * @returns {Object} MongoDB filter object
 */
const buildOrderSearchFilter = (query, userIds = [], options = {}) => {
  const {
    status,
    startDate,
    endDate,
    exactMatch = false
  } = options;

  const filter = {};

  if (query && query.trim()) {
    const searchRegex = buildSearchRegex(query, exactMatch);
    
    filter.$or = [
      { orderNumber: { $in: searchRegex } },
      { 'payment.paymentIntentId': { $in: searchRegex } },
      { 'payment.transactionId': { $in: searchRegex } },
      { 'shipping.trackingNumber': { $in: searchRegex } }
    ];

    // Add user IDs to search if provided
    if (userIds.length > 0) {
      filter.$or.push({ user: { $in: userIds } });
    }
  }

  // Apply additional filters
  if (status) {
    filter.status = status;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  return filter;
};

/**
 * Search users by email or name
 * @param {string} query - Search query
 * @param {Object} User - User model
 * @returns {Promise<Array>} Array of user IDs
 */
const searchUsers = async (query, User) => {
  if (!query || !query.trim()) {
    return [];
  }

  const searchRegex = buildSearchRegex(query);
  
  const userSearchFilter = {
    $or: [
      { email: { $in: searchRegex } },
      { name: { $in: searchRegex } }
    ]
  };

  try {
    const matchingUsers = await User.find(userSearchFilter).select('_id');
    return matchingUsers.map(user => user._id);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Build pagination object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination object
 */
const buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: parseInt(page),
    totalPages,
    total,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    limit: parseInt(limit)
  };
};

module.exports = {
  buildSearchRegex,
  escapeRegex,
  buildProductSearchFilter,
  buildOrderSearchFilter,
  searchUsers,
  buildPagination
};