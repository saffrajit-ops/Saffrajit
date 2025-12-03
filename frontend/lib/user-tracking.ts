/**
 * User Activity Tracking System
 * Tracks user behavior for banner triggers and analytics
 */

export interface UserActivity {
    sessionId: string;
    userId?: string;
    visitCount: number;
    firstVisit: string;
    lastVisit: string;
    currentSession: {
        startTime: string;
        pageViews: number;
        pagesVisited: string[];
        scrollDepth: { [page: string]: number };
        timeOnPage: { [page: string]: number };
        interactions: UserInteraction[];
    };
    behavior: {
        addedToCart: number;
        searchQueries: string[];
        productsViewed: string[];
        categoriesViewed: string[];
        exitIntentTriggered: boolean;
        lastAddToCartTime?: string;
        lastSearchTime?: string;
    };
    preferences: {
        deviceType: 'mobile' | 'tablet' | 'desktop';
        preferredCategories: string[];
        viewedProducts: string[];
    };
}

export interface UserInteraction {
    type: 'click' | 'scroll' | 'search' | 'add-to-cart' | 'view-product' | 'exit-intent';
    timestamp: string;
    data?: any;
    page: string;
}

class UserTracker {
    private static instance: UserTracker;
    private activity: UserActivity | null = null;
    private sessionStartTime: number = Date.now();
    private pageStartTime: number = Date.now();
    private currentPage: string = '';
    private maxScrollDepth: number = 0;
    private scrollListenerAttached: boolean = false;
    private exitIntentListenerAttached: boolean = false;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.initializeTracking();
        }
    }

    public static getInstance(): UserTracker {
        if (!UserTracker.instance) {
            UserTracker.instance = new UserTracker();
        }
        return UserTracker.instance;
    }

    private initializeTracking() {
        // Load existing activity from localStorage
        this.loadActivity();

        // Initialize session
        this.initializeSession();

        // Set up event listeners
        this.setupEventListeners();

        // Track page visibility changes
        this.setupVisibilityTracking();
    }

    private loadActivity() {
        try {
            const stored = localStorage.getItem('userActivity');
            if (stored) {
                this.activity = JSON.parse(stored);

                // Update visit count and last visit
                if (this.activity) {
                    this.activity.visitCount += 1;
                    this.activity.lastVisit = new Date().toISOString();
                }
            }
        } catch (error) {
            console.error('Failed to load user activity:', error);
        }
    }

    private initializeSession() {
        if (!this.activity) {
            // First time visitor
            this.activity = {
                sessionId: this.generateSessionId(),
                visitCount: 1,
                firstVisit: new Date().toISOString(),
                lastVisit: new Date().toISOString(),
                currentSession: {
                    startTime: new Date().toISOString(),
                    pageViews: 0,
                    pagesVisited: [],
                    scrollDepth: {},
                    timeOnPage: {},
                    interactions: [],
                },
                behavior: {
                    addedToCart: 0,
                    searchQueries: [],
                    productsViewed: [],
                    categoriesViewed: [],
                    exitIntentTriggered: false,
                },
                preferences: {
                    deviceType: this.getDeviceType(),
                    preferredCategories: [],
                    viewedProducts: [],
                },
            };
        } else {
            // Returning visitor - reset current session
            this.activity.sessionId = this.generateSessionId();
            this.activity.currentSession = {
                startTime: new Date().toISOString(),
                pageViews: 0,
                pagesVisited: [],
                scrollDepth: {},
                timeOnPage: {},
                interactions: [],
            };
            this.activity.preferences.deviceType = this.getDeviceType();
        }

        this.saveActivity();
    }

    private setupEventListeners() {
        if (typeof window === 'undefined') return;

        // Scroll tracking
        if (!this.scrollListenerAttached) {
            window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
            this.scrollListenerAttached = true;
        }

        // Exit intent tracking (desktop only)
        if (!this.exitIntentListenerAttached && this.getDeviceType() === 'desktop') {
            document.addEventListener('mouseleave', this.handleExitIntent.bind(this));
            this.exitIntentListenerAttached = true;
        }

        // Before unload - save time on page
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    private setupVisibilityTracking() {
        if (typeof document === 'undefined') return;

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveTimeOnPage();
            } else {
                this.pageStartTime = Date.now();
            }
        });
    }

    private handleScroll() {
        if (!this.activity || !this.currentPage) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);

        if (scrollPercentage > this.maxScrollDepth) {
            this.maxScrollDepth = scrollPercentage;
            this.activity.currentSession.scrollDepth[this.currentPage] = scrollPercentage;
            this.saveActivity();
        }
    }

    private handleExitIntent(e: MouseEvent) {
        if (!this.activity) return;

        // Check if mouse is leaving from top of page
        if (e.clientY <= 0 && !this.activity.behavior.exitIntentTriggered) {
            this.activity.behavior.exitIntentTriggered = true;
            this.trackInteraction('exit-intent', { page: this.currentPage });

            // Dispatch custom event for banner system
            window.dispatchEvent(new CustomEvent('userExitIntent'));
        }
    }

    private handleBeforeUnload() {
        this.saveTimeOnPage();
        this.saveActivity();
    }

    private saveTimeOnPage() {
        if (!this.activity || !this.currentPage) return;

        const timeSpent = Math.round((Date.now() - this.pageStartTime) / 1000); // in seconds
        const currentTime = this.activity.currentSession.timeOnPage[this.currentPage] || 0;
        this.activity.currentSession.timeOnPage[this.currentPage] = currentTime + timeSpent;
        this.saveActivity();
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
        if (typeof window === 'undefined') return 'desktop';

        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    private saveActivity() {
        if (!this.activity) return;

        try {
            localStorage.setItem('userActivity', JSON.stringify(this.activity));

            // Also save to separate keys for easy access
            localStorage.setItem('visitCount', this.activity.visitCount.toString());
            localStorage.setItem('firstVisitDate', this.activity.firstVisit);
        } catch (error) {
            console.error('Failed to save user activity:', error);
        }
    }

    // Public methods for tracking specific actions

    public trackPageView(page: string) {
        if (!this.activity) return;

        // Save time on previous page
        if (this.currentPage) {
            this.saveTimeOnPage();
        }

        // Update current page
        this.currentPage = page;
        this.pageStartTime = Date.now();
        this.maxScrollDepth = 0;

        // Track page view
        this.activity.currentSession.pageViews += 1;
        if (!this.activity.currentSession.pagesVisited.includes(page)) {
            this.activity.currentSession.pagesVisited.push(page);
        }

        this.trackInteraction('click', { type: 'page-view', page });
        this.saveActivity();
    }

    public trackAddToCart(productId: string, productName: string) {
        if (!this.activity) return;

        this.activity.behavior.addedToCart += 1;
        this.activity.behavior.lastAddToCartTime = new Date().toISOString();

        this.trackInteraction('add-to-cart', {
            productId,
            productName,
            page: this.currentPage,
        });

        // Dispatch custom event for banner system
        window.dispatchEvent(new CustomEvent('addToCart', {
            detail: { productId, productName }
        }));

        this.saveActivity();
    }

    public trackSearch(query: string) {
        if (!this.activity || !query.trim()) return;

        const normalizedQuery = query.toLowerCase().trim();

        if (!this.activity.behavior.searchQueries.includes(normalizedQuery)) {
            this.activity.behavior.searchQueries.push(normalizedQuery);
        }

        this.activity.behavior.lastSearchTime = new Date().toISOString();

        this.trackInteraction('search', {
            query: normalizedQuery,
            page: this.currentPage,
        });

        // Dispatch custom event for banner system
        window.dispatchEvent(new CustomEvent('userSearch', {
            detail: { query: normalizedQuery }
        }));

        this.saveActivity();
    }

    public trackProductView(productId: string, productName: string, category?: string) {
        if (!this.activity) return;

        // Track product view
        if (!this.activity.behavior.productsViewed.includes(productId)) {
            this.activity.behavior.productsViewed.push(productId);
        }

        // Track category
        if (category && !this.activity.behavior.categoriesViewed.includes(category)) {
            this.activity.behavior.categoriesViewed.push(category);
        }

        // Update preferences
        if (!this.activity.preferences.viewedProducts.includes(productId)) {
            this.activity.preferences.viewedProducts.push(productId);
        }

        if (category) {
            const categoryIndex = this.activity.preferences.preferredCategories.indexOf(category);
            if (categoryIndex === -1) {
                this.activity.preferences.preferredCategories.push(category);
            } else {
                // Move to front (most recent)
                this.activity.preferences.preferredCategories.splice(categoryIndex, 1);
                this.activity.preferences.preferredCategories.unshift(category);
            }
        }

        this.trackInteraction('view-product', {
            productId,
            productName,
            category,
            page: this.currentPage,
        });

        this.saveActivity();
    }

    public trackClick(element: string, data?: any) {
        this.trackInteraction('click', {
            element,
            ...data,
            page: this.currentPage,
        });
    }

    private trackInteraction(type: UserInteraction['type'], data?: any) {
        if (!this.activity) return;

        const interaction: UserInteraction = {
            type,
            timestamp: new Date().toISOString(),
            data,
            page: this.currentPage,
        };

        this.activity.currentSession.interactions.push(interaction);

        // Keep only last 100 interactions to avoid storage issues
        if (this.activity.currentSession.interactions.length > 100) {
            this.activity.currentSession.interactions =
                this.activity.currentSession.interactions.slice(-100);
        }

        this.saveActivity();
    }

    // Getters for banner system

    public getActivity(): UserActivity | null {
        return this.activity;
    }

    public getScrollDepth(page?: string): number {
        if (!this.activity) return 0;
        const targetPage = page || this.currentPage;
        return this.activity.currentSession.scrollDepth[targetPage] || 0;
    }

    public hasAddedToCart(): boolean {
        return (this.activity?.behavior.addedToCart || 0) > 0;
    }

    public getSearchQueries(): string[] {
        return this.activity?.behavior.searchQueries || [];
    }

    public hasSearchedFor(keyword: string): boolean {
        const queries = this.getSearchQueries();
        const normalizedKeyword = keyword.toLowerCase();
        return queries.some(q => q.includes(normalizedKeyword));
    }

    public getVisitCount(): number {
        return this.activity?.visitCount || 0;
    }

    public isNewUser(): boolean {
        if (!this.activity) return true;

        const firstVisit = new Date(this.activity.firstVisit);
        const daysSinceFirst = (Date.now() - firstVisit.getTime()) / (1000 * 60 * 60 * 24);

        return daysSinceFirst <= 7;
    }

    public isReturningUser(): boolean {
        return this.getVisitCount() > 1;
    }

    public getPreferredCategories(): string[] {
        return this.activity?.preferences.preferredCategories || [];
    }

    public getViewedProducts(): string[] {
        return this.activity?.preferences.viewedProducts || [];
    }

    public getCurrentPage(): string {
        return this.currentPage;
    }

    public getSessionDuration(): number {
        return Math.round((Date.now() - this.sessionStartTime) / 1000); // in seconds
    }

    // Clear tracking data (for testing or user privacy)
    public clearTracking() {
        this.activity = null;
        localStorage.removeItem('userActivity');
        localStorage.removeItem('visitCount');
        localStorage.removeItem('firstVisitDate');
    }
}

// Export singleton instance
export const userTracker = UserTracker.getInstance();

// Helper functions for easy access
export const trackPageView = (page: string) => userTracker.trackPageView(page);
export const trackAddToCart = (productId: string, productName: string) =>
    userTracker.trackAddToCart(productId, productName);
export const trackSearch = (query: string) => userTracker.trackSearch(query);
export const trackProductView = (productId: string, productName: string, category?: string) =>
    userTracker.trackProductView(productId, productName, category);
export const trackClick = (element: string, data?: any) =>
    userTracker.trackClick(element, data);
export const getUserActivity = () => userTracker.getActivity();
export const getScrollDepth = (page?: string) => userTracker.getScrollDepth(page);
export const hasAddedToCart = () => userTracker.hasAddedToCart();
export const getSearchQueries = () => userTracker.getSearchQueries();
export const hasSearchedFor = (keyword: string) => userTracker.hasSearchedFor(keyword);
