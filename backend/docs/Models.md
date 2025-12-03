# 🛍️ Express + MongoDB E-Commerce API

A modular RESTful backend built with **Express 5**, **Mongoose**, **JWT**, and **Stripe/PayPal** for modern e-commerce platforms.

---

## 📦 Tech Stack

- **Framework:** Express 5  
- **Database:** MongoDB with Mongoose ODM  
- **Authentication:** JWT (stateless)  
- **Crypto:** bcrypt (password hashing)  
- **Uploads:** multer + Cloudinary (optional)  
- **Payments:** Stripe (recommended) / PayPal  
- **Validation:** Joi or express-validator  

---

## 📁 Data Models

Below are all MongoDB collections with their schemas and indexes.

---

### 🧑‍💼 Users

**Collection:** `users`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | Primary ID |
| `email` | String | Required, unique, lowercase, indexed |
| `passwordHash` | String | Required |
| `name` | String | User’s full name |
| `phone` | String | Optional |
| `isActive` | Boolean | Default `true` |
| `addresses` | [Address] | Embedded subdocs |
| `createdAt` | Date | Default `Date.now` |
| `updatedAt` | Date | — |

#### **Address (embedded)**
| Field | Type | Description |
|--------|------|-------------|
| `label` | String | e.g., “Home”, “Office” |
| `line1` | String | Required |
| `line2` | String | — |
| `city` | String | Required |
| `state` | String | Required |
| `zip` | String | Required |
| `country` | String | Required |
| `isDefault` | Boolean | Default `false` |

**Indexes:**  
- `email` → unique

---

### 🗂️ Taxonomies

**Collection:** `taxonomies`

Used to unify collections, categories, concerns, and gift types.

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `name` | String | Required |
| `slug` | String | Required, unique, URL-safe |
| `type` | String | Enum: `collection`, `category`, `concern`, `gift-type` |
| `parentId` | ObjectId | Ref `taxonomies` (optional nesting) |
| `position` | Number | Sort order |
| `isActive` | Boolean | Default `true` |
| `createdAt` | Date | — |
| `updatedAt` | Date | — |

**Indexes:**  
- `slug` unique  
- `{ type, name }` compound (optional)

---

### 🛒 Products

**Collection:** `products`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `type` | String | Enum: `single`, `gift-set`, required |
| `title` | String | Required |
| `slug` | String | Required, unique |
| `sku` | String | Unique, indexed |
| `barcode` | String | Optional |
| `brand` | String | Default “Cana Gold” |
| `shortDescription` | String | — |
| `description` | String | Long-form HTML |
| `benefits` | [String] | Bullet points |
| `howToApply` | String | — |
| `ingredientsText` | String | Raw text |
| `ingredients` | [ObjectId] | Ref `ingredients` (optional) |
| `price` | Number | Required |
| `compareAtPrice` | Number | Optional |
| `currency` | String | Default `USD` |
| `stock` | Number | Required |
| `isActive` | Boolean | Default `true` |
| `isFeatured` | Boolean | Default `false` |
| `images` | [{ url, alt, position }] | — |
| `attributes` | { shade?, size?, skinType? } | Lightweight variant data |
| `ratingAvg` | Number | Default `0` |
| `ratingCount` | Number | Default `0` |
| `taxonomies` | [ObjectId] | Ref `taxonomies` |
| `components` | [{ productId, qty }] | For gift sets only |
| `relatedProductIds` | [ObjectId] | Manual curation |
| `meta` | { title?, description?, keywords?, canonicalUrl? } | SEO meta |
| `createdAt` | Date | — |
| `updatedAt` | Date | — |

**Indexes:**  
- `slug` unique  
- `sku` unique  
- Text index on `title`, `brand`, `ingredientsText`

---

### ⭐ Reviews

**Collection:** `reviews`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `productId` | ObjectId | Ref `products`, required |
| `userId` | ObjectId | Ref `users`, required |
| `rating` | Number | 1–5 |
| `title` | String | — |
| `comment` | String | Max 2000 chars |
| `isVerifiedBuyer` | Boolean | Default `false` |
| `createdAt` | Date | Default now |
| `updatedAt` | Date | — |

**Indexes:**  
- `{ productId, createdAt }`  
- Optional unique `{ userId, productId }`

---

### 🛍️ Carts

**Collection:** `carts`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `userId` | ObjectId | Ref `users` |
| `items` | [{ productId, titleSnapshot, priceSnapshot, qty, variant }] | Snapshot ensures price/title consistency |
| `couponCode` | String | — |
| `updatedAt` | Date | — |

**Indexes:**  
- `userId` or `guestCartId`

---

### ❤️ Wishlists

**Collection:** `wishlists`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `userId` | ObjectId | Ref `users`, unique |
| `productIds` | [ObjectId] | Ref `products` |
| `updatedAt` | Date | — |

**Index:**  
- Unique `userId`

---

### 📦 Orders

**Collection:** `orders`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `orderNo` | String | Unique, human-friendly |
| `userId` | ObjectId | Ref `users` |
| `guestEmail` | String | For guest checkout |
| `items` | [{ productId, title, sku, price, qty }] | Snapshot |
| `totals` | { subtotal, discount, shipping, tax, grand } | — |
| `shippingAddress` | Address | Embedded |
| `billingAddress` | Address | Embedded |
| `shippingMethod` | { code, label, cost } | — |
| `payment` | { provider, status, refId, capturedAt? } | — |
| `status` | Enum: `pending`, `paid`, `shipped`, `delivered`, `returned`, `refunded`, `cancelled` |
| `timeline` | [{ at, status, note? }] | — |
| `notes` | String | — |
| `createdAt` | Date | — |
| `updatedAt` | Date | — |

**Indexes:**  
- `{ userId, createdAt }`  
- `orderNo` unique  
- `status`

---

### 🔁 Returns (RMAs)

**Collection:** `returns`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `orderId` | ObjectId | Ref `orders`, required |
| `userId` | ObjectId | Ref `users` |
| `items` | [{ productId, qty, reason, condition? }] | — |
| `status` | Enum: `requested`, `authorized`, `received`, `approved`, `rejected`, `refunded` |
| `refund` | { method, amount, processedAt? } | — |
| `createdAt` | Date | — |
| `updatedAt` | Date | — |

**Indexes:**  
- `{ orderId, createdAt }`

---

### 🎟️ Coupons

**Collection:** `coupons`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `code` | String | Required, unique |
| `type` | Enum: `flat`, `percent` |
| `value` | Number | Required |
| `minSubtotal` | Number | — |
| `startsAt` | Date | — |
| `endsAt` | Date | — |
| `usageLimit` | Number | — |
| `usedCount` | Number | Default `0` |
| `appliesTo` | { productIds?, taxonomyIds? } | Restrictable |
| `isActive` | Boolean | Default `true` |
| `createdAt` | Date | — |
| `updatedAt` | Date | — |

**Indexes:**  
- `code` unique  
- `{ isActive, endsAt }`

---

### 💰 Store Credits

**Collection:** `credit_transactions`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `userId` | ObjectId | Ref `users`, required |
| `orderId` | ObjectId | Ref `orders` |
| `type` | Enum: `grant`, `redeem`, `expire`, `adjust` |
| `amount` | Number | Positive or negative |
| `balanceAfter` | Number | — |
| `note` | String | — |
| `createdAt` | Date | — |

**Index:**  
- `{ userId, createdAt }`

---

### 🤝 Referrals

**Collection:** `referrals`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `referrerUserId` | ObjectId | Ref `users`, required |
| `code` | String | Unique |
| `status` | Enum: `created`, `clicked`, `signed_up`, `order_placed`, `reward_paid` |
| `referredUserId` | ObjectId | Ref `users` |
| `firstOrderId` | ObjectId | Ref `orders` |
| `createdAt` | Date | — |
| `updatedAt` | Date | — |

**Indexes:**  
- `code` unique  
- `{ referrerUserId, createdAt }`

---

### 📄 CMS Pages

**Collection:** `pages`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `title` | String | Required |
| `slug` | String | Unique, required |
| `body` | String | HTML |
| `meta` | { title?, description?, canonicalUrl? } | — |
| `isPublished` | Boolean | Default `true` |
| `publishedAt` | Date | — |
| `updatedAt` | Date | — |

Examples: Privacy Policy, Terms of Service, FAQ, Our Story, etc.

---

### 📰 Blog Posts

**Collection:** `blog_posts`

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | — |
| `title` | String | Required |
| `slug` | String | Unique, required |
| `excerpt` | String | — |
| `body` | String | HTML |
| `coverImage` | { url, alt } | — |
| `tags` | [String] | e.g., collagen, peptides |
| `category` | String | e.g., Skincare Essentials |
| `author` | String | — |
| `isPublished` | Boolean | Default `true` |
| `publishedAt` | Date | — |
| `updatedAt` | Date | — |

**Indexes:**  
- Text index on `title`, `excerpt`, `body`, `tags`

---

### ⚙️ Settings

**Collection:** `settings` (singleton)

| Field | Type | Description |
|--------|------|-------------|
| `_id` | ObjectId | Fixed singleton ID |
| `store` | { name, currency, supportEmail, phone } | — |
| `shipping` | { flatRates: [{ code, label, cost }], freeShipMin } | — |
| `tax` | { percent } | — |
| `seo` | { siteName, defaultTitle, defaultDescription } | — |
| `createdAt` | Date | — |
| `updatedAt` | Date | — |

---

## 🔍 Search Strategy

- MongoDB **text index** on:
  - `products.title`
  - `products.brand`
  - `products.ingredientsText`
- Filter by taxonomy IDs:  
  ```js
  { taxonomies: { $in: [taxonomyIds...] } }
