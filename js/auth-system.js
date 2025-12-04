/**
 * Authentication and Role-Based Access Control System
 * Handles user authentication, authorization, and session management
 */

class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.sessions = JSON.parse(localStorage.getItem('sessions')) || [];
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
        
        // Initialize with default admin user if no users exist
        if (this.users.length === 0) {
            this.createDefaultAdmin();
        }
    }

    /**
     * Create default admin user
     */
    createDefaultAdmin() {
        const defaultAdmin = {
            id: 'admin-001',
            username: 'admin',
            email: 'admin@library.com',
            passwordHash: this.hashPassword('admin123'), // Default password
            role: 'Admin',
            fullName: 'System Administrator',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true
        };
        this.users.push(defaultAdmin);
        this.saveUsers();
    }

    /**
     * Hash password (simple implementation - use bcrypt in production)
     * @param {string} password - Plain text password
     * @returns {string} - Hashed password
     */
    hashPassword(password) {
        // Simple hash function - in production, use bcrypt or similar
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36) + password.length.toString();
    }

    /**
     * Register a new user
     * @param {object} userData - User registration data
     * @returns {object} - {success: boolean, user: object, error: string}
     */
    register(userData) {
        // Validate input
        if (!userData.username || userData.username.trim().length < 3) {
            return { success: false, error: 'Username must be at least 3 characters' };
        }

        if (!userData.password || userData.password.length < 6) {
            return { success: false, error: 'Password must be at least 6 characters' };
        }

        if (!userData.email || !this.validateEmail(userData.email)) {
            return { success: false, error: 'Valid email is required' };
        }

        // Check for duplicate username
        if (this.users.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
            return { success: false, error: 'Username already exists' };
        }

        // Check for duplicate email
        if (this.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            return { success: false, error: 'Email already exists' };
        }

        // Validate role (only Admin can create Admin users)
        const allowedRoles = ['Librarian', 'Member'];
        if (!allowedRoles.includes(userData.role)) {
            userData.role = 'Member'; // Default to Member
        }

        const user = {
            id: 'user-' + Date.now().toString(),
            username: Validator.sanitize(userData.username),
            email: Validator.sanitize(userData.email),
            passwordHash: this.hashPassword(userData.password),
            role: userData.role || 'Member',
            fullName: userData.fullName ? Validator.sanitize(userData.fullName) : '',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true
        };

        this.users.push(user);
        this.saveUsers();

        return { success: true, user: { ...user, passwordHash: undefined } };
    }

    /**
     * Login user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {object} - {success: boolean, user: object, error: string}
     */
    login(username, password) {
        // Check for account lockout
        const lockout = this.checkLockout(username);
        if (lockout.locked) {
            return { success: false, error: `Account locked. Try again in ${Math.ceil(lockout.remaining / 60000)} minutes` };
        }

        const user = this.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && u.isActive
        );

        if (!user) {
            this.recordFailedAttempt(username);
            return { success: false, error: 'Invalid username or password' };
        }

        const passwordHash = this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            this.recordFailedAttempt(username);
            return { success: false, error: 'Invalid username or password' };
        }

        // Successful login
        user.lastLogin = new Date().toISOString();
        this.currentUser = { ...user, passwordHash: undefined };
        this.saveUsers();
        this.saveCurrentUser();
        this.clearFailedAttempts(username);
        this.createSession(user.id);

        return { success: true, user: this.currentUser };
    }

    /**
     * Logout current user
     */
    logout() {
        if (this.currentUser) {
            this.endSession(this.currentUser.id);
        }
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Check if user has required role
     * @param {string} requiredRole - Required role
     * @returns {boolean}
     */
    hasRole(requiredRole) {
        if (!this.currentUser) return false;
        
        const roleHierarchy = {
            'Member': 1,
            'Librarian': 2,
            'Admin': 3
        };

        const userLevel = roleHierarchy[this.currentUser.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }

    /**
     * Check if user has permission for action
     * @param {string} action - Action to check
     * @returns {boolean}
     */
    hasPermission(action) {
        if (!this.currentUser) return false;

        const permissions = {
            'Admin': ['all'],
            'Librarian': ['view', 'add', 'edit', 'delete', 'borrow', 'return', 'manage_borrowers', 'export', 'import'],
            'Member': ['view', 'search', 'borrow']
        };

        const userPermissions = permissions[this.currentUser.role] || [];
        return userPermissions.includes('all') || userPermissions.includes(action);
    }

    /**
     * Get current user
     * @returns {object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get all users (Admin only)
     * @returns {array}
     */
    getAllUsers() {
        if (!this.hasRole('Admin')) {
            return [];
        }
        return this.users.map(u => ({ ...u, passwordHash: undefined }));
    }

    /**
     * Update user role (Admin only)
     * @param {string} userId - User ID
     * @param {string} newRole - New role
     * @returns {object} - {success: boolean, error: string}
     */
    updateUserRole(userId, newRole) {
        if (!this.hasRole('Admin')) {
            return { success: false, error: 'Insufficient permissions' };
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const validRoles = ['Admin', 'Librarian', 'Member'];
        if (!validRoles.includes(newRole)) {
            return { success: false, error: 'Invalid role' };
        }

        user.role = newRole;
        this.saveUsers();

        return { success: true };
    }

    /**
     * Change password
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {object} - {success: boolean, error: string}
     */
    changePassword(oldPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, error: 'Not authenticated' };
        }

        const user = this.users.find(u => u.id === this.currentUser.id);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        if (user.passwordHash !== this.hashPassword(oldPassword)) {
            return { success: false, error: 'Current password is incorrect' };
        }

        if (newPassword.length < 6) {
            return { success: false, error: 'New password must be at least 6 characters' };
        }

        user.passwordHash = this.hashPassword(newPassword);
        this.saveUsers();

        return { success: true };
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean}
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Record failed login attempt
     * @param {string} username - Username
     */
    recordFailedAttempt(username) {
        const key = `failed_attempts_${username.toLowerCase()}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        attempts.push(Date.now());
        
        // Keep only recent attempts (within lockout duration)
        const recentAttempts = attempts.filter(time => Date.now() - time < this.lockoutDuration);
        localStorage.setItem(key, JSON.stringify(recentAttempts));
    }

    /**
     * Check if account is locked
     * @param {string} username - Username
     * @returns {object} - {locked: boolean, remaining: number}
     */
    checkLockout(username) {
        const key = `failed_attempts_${username.toLowerCase()}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const recentAttempts = attempts.filter(time => Date.now() - time < this.lockoutDuration);

        if (recentAttempts.length >= this.maxLoginAttempts) {
            const oldestAttempt = Math.min(...recentAttempts);
            const remaining = this.lockoutDuration - (Date.now() - oldestAttempt);
            return { locked: remaining > 0, remaining: remaining };
        }

        return { locked: false, remaining: 0 };
    }

    /**
     * Clear failed attempts
     * @param {string} username - Username
     */
    clearFailedAttempts(username) {
        const key = `failed_attempts_${username.toLowerCase()}`;
        localStorage.removeItem(key);
    }

    /**
     * Create session
     * @param {string} userId - User ID
     */
    createSession(userId) {
        const session = {
            id: 'session-' + Date.now().toString(),
            userId: userId,
            startTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            ipAddress: null, // Would be set by server
            userAgent: navigator.userAgent
        };

        this.sessions.push(session);
        this.saveSessions();
    }

    /**
     * End session
     * @param {string} userId - User ID
     */
    endSession(userId) {
        const activeSession = this.sessions.find(s => s.userId === userId && !s.endTime);
        if (activeSession) {
            activeSession.endTime = new Date().toISOString();
            this.saveSessions();
        }
    }

    /**
     * Save users to localStorage
     */
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    /**
     * Save current user to localStorage
     */
    saveCurrentUser() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    /**
     * Save sessions to localStorage
     */
    saveSessions() {
        localStorage.setItem('sessions', JSON.stringify(this.sessions));
    }
}

