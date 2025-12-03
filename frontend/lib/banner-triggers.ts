// Banner Trigger Evaluation Utilities

export interface BannerTriggers {
  device?: {
    enabled: boolean
    types: ('mobile' | 'tablet' | 'desktop')[]
  }
  behavior?: {
    enabled: boolean
    scrollPercentage?: number
    exitIntent?: boolean
    addToCart?: boolean
    searchKeywords?: string[]
  }
  userType?: {
    enabled: boolean
    types: ('guest' | 'logged-in' | 'new-user' | 'returning-user' | 'premium')[]
  }
  inventory?: {
    enabled: boolean
    outOfStock?: boolean
    codAvailable?: boolean
    specificCategories?: string[]
  }
}

export interface Banner {
  _id: string
  title: string
  description?: string
  image: { url: string }
  link?: string
  linkText?: string
  type: 'popup' | 'footer' | 'sidebar'
  pages?: string[]
  triggers?: BannerTriggers
  isActive: boolean
  startDate: string
  endDate?: string
}

// Detect device type
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Check if user is logged in
export function isUserLoggedIn(): boolean {
  if (typeof window === 'undefined') return false

  // Check for auth token in localStorage or cookie
  const token = localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    document.cookie.includes('accessToken')

  return !!token
}

// Get user type
export function getUserType(): 'guest' | 'logged-in' | 'new-user' | 'returning-user' | 'premium' {
  if (!isUserLoggedIn()) return 'guest'

  // Check if user is premium (you can customize this logic)
  const userRole = localStorage.getItem('userRole')
  if (userRole === 'premium') return 'premium'

  // Check if user is new (registered within last 7 days)
  const registrationDate = localStorage.getItem('registrationDate')
  if (registrationDate) {
    const daysSinceRegistration = (Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceRegistration <= 7) return 'new-user'
  }

  // Check if returning user (has visited before)
  const visitCount = parseInt(localStorage.getItem('visitCount') || '0')
  if (visitCount > 1) return 'returning-user'

  return 'logged-in'
}

// Evaluate device trigger
export function evaluateDeviceTrigger(banner: Banner): boolean {
  if (!banner.triggers?.device?.enabled) {
    console.log('  📱 Device trigger: DISABLED (pass)')
    return true
  }

  const currentDevice = getDeviceType()
  const allowed = banner.triggers.device.types
  const passes = allowed.includes(currentDevice)

  console.log(`  📱 Device trigger: ${passes ? 'PASS' : 'FAIL'}`, {
    current: currentDevice,
    allowed: allowed
  })

  return passes
}

// Evaluate user type trigger
export function evaluateUserTypeTrigger(banner: Banner): boolean {
  if (!banner.triggers?.userType?.enabled) {
    console.log('  👤 User type trigger: DISABLED (pass)')
    return true
  }

  const currentUserType = getUserType()
  const allowed = banner.triggers.userType.types
  const passes = allowed.includes(currentUserType)

  console.log(`  👤 User type trigger: ${passes ? 'PASS' : 'FAIL'}`, {
    current: currentUserType,
    allowed: allowed
  })

  return passes
}

// Evaluate inventory trigger (for product pages)
export function evaluateInventoryTrigger(
  banner: Banner,
  productData?: {
    isOutOfStock?: boolean
    codAvailable?: boolean
    categoryId?: string
  }
): boolean {
  if (!banner.triggers?.inventory?.enabled) return true

  const trigger = banner.triggers.inventory

  // Check out of stock condition
  if (trigger.outOfStock && !productData?.isOutOfStock) {
    return false
  }

  // Check COD available condition
  if (trigger.codAvailable && !productData?.codAvailable) {
    return false
  }

  // Check specific categories
  if (trigger.specificCategories && trigger.specificCategories.length > 0) {
    if (!productData?.categoryId) return false
    if (!trigger.specificCategories.includes(productData.categoryId)) {
      return false
    }
  }

  return true
}

// Main function to check if banner should be shown
export function shouldShowBanner(
  banner: Banner,
  context?: {
    productData?: {
      isOutOfStock?: boolean
      codAvailable?: boolean
      categoryId?: string
    }
  }
): boolean {
  console.log('🔍 Evaluating banner triggers...')

  // Check if banner is active and within date range
  const now = new Date()
  const startDate = new Date(banner.startDate)
  const endDate = banner.endDate ? new Date(banner.endDate) : null

  console.log('📅 Date check:', {
    now: now.toISOString(),
    startDate: startDate.toISOString(),
    endDate: endDate?.toISOString(),
    isActive: banner.isActive
  })

  if (!banner.isActive) {
    console.log('❌ Banner is not active')
    return false
  }
  if (now < startDate) {
    console.log('❌ Banner start date is in the future')
    return false
  }
  if (endDate && now > endDate) {
    console.log('❌ Banner end date has passed')
    return false
  }

  // Evaluate all triggers
  const deviceCheck = evaluateDeviceTrigger(banner)
  console.log('📱 Device trigger:', deviceCheck)
  if (!deviceCheck) return false

  const userTypeCheck = evaluateUserTypeTrigger(banner)
  console.log('👤 User type trigger:', userTypeCheck)
  if (!userTypeCheck) return false

  const inventoryCheck = evaluateInventoryTrigger(banner, context?.productData)
  console.log('📦 Inventory trigger:', inventoryCheck)
  if (!inventoryCheck) return false

  console.log('✅ All triggers passed!')
  return true
}

// Track scroll percentage for behavior trigger
export function setupScrollTrigger(
  callback: () => void,
  targetPercentage: number
): () => void {
  let triggered = false

  const handleScroll = () => {
    if (triggered) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
    const scrollPercentage = (scrollTop / scrollHeight) * 100

    if (scrollPercentage >= targetPercentage) {
      triggered = true
      callback()
    }
  }

  window.addEventListener('scroll', handleScroll)

  // Return cleanup function
  return () => window.removeEventListener('scroll', handleScroll)
}

// Setup exit intent trigger
export function setupExitIntentTrigger(callback: () => void): () => void {
  let triggered = false

  const handleMouseLeave = (e: MouseEvent) => {
    if (triggered) return

    // Check if mouse is leaving from top of page
    if (e.clientY <= 0) {
      triggered = true
      callback()
    }
  }

  document.addEventListener('mouseleave', handleMouseLeave)

  // Return cleanup function
  return () => document.removeEventListener('mouseleave', handleMouseLeave)
}

// Track add to cart event
export function setupAddToCartTrigger(callback: () => void): () => void {
  const handleAddToCart = () => {
    callback()
  }

  // Listen for custom add-to-cart event
  window.addEventListener('addToCart', handleAddToCart)

  // Return cleanup function
  return () => window.removeEventListener('addToCart', handleAddToCart)
}

// Check search keyword trigger
export function checkSearchKeywordTrigger(
  banner: Banner,
  searchQuery: string
): boolean {
  if (!banner.triggers?.behavior?.enabled) return true
  if (!banner.triggers.behavior.searchKeywords || banner.triggers.behavior.searchKeywords.length === 0) {
    return true
  }

  const keywords = banner.triggers.behavior.searchKeywords
  const query = searchQuery.toLowerCase()

  return keywords.some(keyword => query.includes(keyword.toLowerCase()))
}

// Increment visit count for returning user detection
export function trackVisit(): void {
  if (typeof window === 'undefined') return

  const visitCount = parseInt(localStorage.getItem('visitCount') || '0')
  localStorage.setItem('visitCount', (visitCount + 1).toString())

  // Set first visit date if not exists
  if (!localStorage.getItem('firstVisitDate')) {
    localStorage.setItem('firstVisitDate', new Date().toISOString())
  }
}

// Enhanced search keyword trigger with user tracking
export function checkSearchKeywordTriggerWithTracking(
  banner: Banner,
  userSearchQueries: string[]
): boolean {
  if (!banner.triggers?.behavior?.enabled) return true
  if (!banner.triggers.behavior.searchKeywords || banner.triggers.behavior.searchKeywords.length === 0) {
    return true
  }

  const keywords = banner.triggers.behavior.searchKeywords

  // Check if any user search query matches banner keywords
  return userSearchQueries.some(userQuery =>
    keywords.some(keyword =>
      userQuery.toLowerCase().includes(keyword.toLowerCase())
    )
  )
}
