/**
 * Borrowing Management System
 * Handles book checkout, return, and borrower management
 */

class BorrowingSystem {
    constructor() {
        this.borrowers = JSON.parse(localStorage.getItem('borrowers')) || [];
        this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
        this.defaultLoanDays = 14; // Default loan period in days
    }

    /**
     * Register a new borrower
     * @param {object} borrowerData - Borrower information
     * @returns {object} - {success: boolean, borrower: object, error: string}
     */
    registerBorrower(borrowerData) {
        // Validate borrower data
        if (!borrowerData.name || borrowerData.name.trim().length === 0) {
            return { success: false, error: 'Borrower name is required' };
        }

        // Check for duplicate email if provided
        if (borrowerData.email) {
            const duplicate = this.borrowers.find(b => 
                b.email && b.email.toLowerCase() === borrowerData.email.toLowerCase()
            );
            if (duplicate) {
                return { success: false, error: 'Borrower with this email already exists' };
            }
        }

        const borrower = {
            id: Date.now().toString(),
            name: Validator.sanitize(borrowerData.name),
            email: borrowerData.email ? Validator.sanitize(borrowerData.email) : '',
            phone: borrowerData.phone ? Validator.sanitize(borrowerData.phone) : '',
            address: borrowerData.address ? Validator.sanitize(borrowerData.address) : '',
            createdAt: new Date().toISOString()
        };

        this.borrowers.push(borrower);
        this.saveBorrowers();

        return { success: true, borrower: borrower };
    }

    /**
     * Check out a book
     * @param {string} bookId - Book ID
     * @param {string} borrowerId - Borrower ID
     * @param {number} loanDays - Loan period in days (optional)
     * @returns {object} - {success: boolean, transaction: object, error: string}
     */
    checkoutBook(bookId, borrowerId, loanDays = null) {
        const borrower = this.borrowers.find(b => b.id === borrowerId);
        if (!borrower) {
            return { success: false, error: 'Borrower not found' };
        }

        // Check if book is already borrowed
        const activeTransaction = this.transactions.find(t => 
            t.bookId === bookId && t.status === 'Active'
        );

        if (activeTransaction) {
            return { success: false, error: 'This book is already checked out' };
        }

        const checkoutDate = new Date();
        const dueDate = new Date(checkoutDate);
        dueDate.setDate(dueDate.getDate() + (loanDays || this.defaultLoanDays));

        const transaction = {
            id: Date.now().toString(),
            bookId: bookId,
            borrowerId: borrowerId,
            checkoutDate: checkoutDate.toISOString(),
            dueDate: dueDate.toISOString(),
            returnDate: null,
            status: 'Active',
            fineAmount: 0,
            createdAt: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.saveTransactions();

        return { success: true, transaction: transaction };
    }

    /**
     * Return a book
     * @param {string} transactionId - Transaction ID
     * @param {number} fineAmount - Fine amount if overdue (optional)
     * @returns {object} - {success: boolean, transaction: object, error: string}
     */
    returnBook(transactionId, fineAmount = 0) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction) {
            return { success: false, error: 'Transaction not found' };
        }

        if (transaction.status !== 'Active') {
            return { success: false, error: 'This book is not currently checked out' };
        }

        transaction.returnDate = new Date().toISOString();
        transaction.status = 'Returned';
        transaction.fineAmount = fineAmount;

        this.saveTransactions();

        return { success: true, transaction: transaction };
    }

    /**
     * Get active transactions for a book
     * @param {string} bookId - Book ID
     * @returns {array} - Array of active transactions
     */
    getActiveTransactions(bookId) {
        return this.transactions.filter(t => 
            t.bookId === bookId && t.status === 'Active'
        );
    }

    /**
     * Get transactions for a borrower
     * @param {string} borrowerId - Borrower ID
     * @returns {array} - Array of transactions
     */
    getBorrowerTransactions(borrowerId) {
        return this.transactions.filter(t => t.borrowerId === borrowerId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Get overdue books
     * @returns {array} - Array of overdue transactions
     */
    getOverdueBooks() {
        const now = new Date();
        return this.transactions.filter(t => {
            if (t.status !== 'Active') return false;
            return new Date(t.dueDate) < now;
        });
    }

    /**
     * Calculate fine for overdue book
     * @param {string} transactionId - Transaction ID
     * @param {number} dailyFine - Daily fine amount (default: 0.50)
     * @returns {number} - Calculated fine amount
     */
    calculateFine(transactionId, dailyFine = 0.50) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (!transaction || transaction.status !== 'Active') {
            return 0;
        }

        const now = new Date();
        const dueDate = new Date(transaction.dueDate);

        if (now <= dueDate) {
            return 0;
        }

        const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
        return daysOverdue * dailyFine;
    }

    /**
     * Get borrower by ID
     * @param {string} borrowerId - Borrower ID
     * @returns {object|null} - Borrower object or null
     */
    getBorrower(borrowerId) {
        return this.borrowers.find(b => b.id === borrowerId) || null;
    }

    /**
     * Get all borrowers
     * @returns {array} - Array of all borrowers
     */
    getAllBorrowers() {
        return [...this.borrowers];
    }

    /**
     * Save borrowers to localStorage
     */
    saveBorrowers() {
        localStorage.setItem('borrowers', JSON.stringify(this.borrowers));
    }

    /**
     * Save transactions to localStorage
     */
    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }
}

