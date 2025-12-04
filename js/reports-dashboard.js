/**
 * Reports and Analytics Dashboard
 * Generates comprehensive reports and analytics
 */

class ReportsDashboard {
    constructor(books, borrowingSystem, auditLogger) {
        this.books = books;
        this.borrowingSystem = borrowingSystem;
        this.auditLogger = auditLogger;
    }

    /**
     * Get overall library statistics
     * @returns {object} - Statistics object
     */
    getLibraryStats() {
        const stats = {
            totalBooks: this.books.length,
            availableBooks: 0,
            borrowedBooks: 0,
            reservedBooks: 0,
            lostBooks: 0,
            totalBorrowers: this.borrowingSystem.getAllBorrowers().length,
            activeLoans: 0,
            overdueLoans: 0,
            totalTransactions: this.borrowingSystem.transactions.length,
            totalFines: 0
        };

        // Count books by status
        this.books.forEach(book => {
            switch (book.status) {
                case 'Available':
                    stats.availableBooks++;
                    break;
                case 'Borrowed':
                    stats.borrowedBooks++;
                    break;
                case 'Reserved':
                    stats.reservedBooks++;
                    break;
                case 'Lost':
                    stats.lostBooks++;
                    break;
            }
        });

        // Count active and overdue loans
        const activeTransactions = this.borrowingSystem.transactions.filter(t => t.status === 'Active');
        stats.activeLoans = activeTransactions.length;

        const overdue = this.borrowingSystem.getOverdueBooks();
        stats.overdueLoans = overdue.length;

        // Calculate total fines
        overdue.forEach(transaction => {
            stats.totalFines += this.borrowingSystem.calculateFine(transaction.id);
        });

        return stats;
    }

    /**
     * Get popular books (most borrowed)
     * @param {number} limit - Number of books to return
     * @returns {array} - Array of popular books with stats
     */
    getPopularBooks(limit = 10) {
        const bookBorrowCount = {};

        this.borrowingSystem.transactions.forEach(transaction => {
            const bookId = transaction.bookId;
            bookBorrowCount[bookId] = (bookBorrowCount[bookId] || 0) + 1;
        });

        const popular = Object.entries(bookBorrowCount)
            .map(([bookId, count]) => {
                const book = this.books.find(b => b.id === bookId);
                return {
                    book: book,
                    borrowCount: count
                };
            })
            .filter(item => item.book)
            .sort((a, b) => b.borrowCount - a.borrowCount)
            .slice(0, limit);

        return popular;
    }

    /**
     * Get borrowing trends
     * @param {string} period - 'daily', 'weekly', 'monthly', 'yearly'
     * @returns {array} - Array of trend data
     */
    getBorrowingTrends(period = 'monthly') {
        const trends = {};
        const now = new Date();

        this.borrowingSystem.transactions.forEach(transaction => {
            const date = new Date(transaction.checkoutDate);
            let key;

            switch (period) {
                case 'daily':
                    key = date.toISOString().split('T')[0];
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'yearly':
                    key = date.getFullYear().toString();
                    break;
                default:
                    key = date.toISOString().split('T')[0];
            }

            trends[key] = (trends[key] || 0) + 1;
        });

        return Object.entries(trends)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    /**
     * Get genre distribution
     * @returns {array} - Array of genre statistics
     */
    getGenreDistribution() {
        const genreCount = {};

        this.books.forEach(book => {
            const genre = book.genre || 'Unknown';
            genreCount[genre] = (genreCount[genre] || 0) + 1;
        });

        return Object.entries(genreCount)
            .map(([genre, count]) => ({
                genre,
                count,
                percentage: ((count / this.books.length) * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Get borrower activity
     * @param {number} limit - Number of borrowers to return
     * @returns {array} - Array of active borrowers
     */
    getBorrowerActivity(limit = 10) {
        const borrowerActivity = {};

        this.borrowingSystem.transactions.forEach(transaction => {
            const borrowerId = transaction.borrowerId;
            if (!borrowerActivity[borrowerId]) {
                borrowerActivity[borrowerId] = {
                    borrower: this.borrowingSystem.getBorrower(borrowerId),
                    totalBorrows: 0,
                    activeLoans: 0,
                    overdueLoans: 0,
                    totalFines: 0
                };
            }

            borrowerActivity[borrowerId].totalBorrows++;

            if (transaction.status === 'Active') {
                borrowerActivity[borrowerId].activeLoans++;
                if (new Date(transaction.dueDate) < new Date()) {
                    borrowerActivity[borrowerId].overdueLoans++;
                    borrowerActivity[borrowerId].totalFines += this.borrowingSystem.calculateFine(transaction.id);
                }
            }
        });

        return Object.values(borrowerActivity)
            .filter(item => item.borrower)
            .sort((a, b) => b.totalBorrows - a.totalBorrows)
            .slice(0, limit);
    }

    /**
     * Get recent activity
     * @param {number} limit - Number of activities to return
     * @returns {array} - Array of recent activities
     */
    getRecentActivity(limit = 20) {
        const logs = this.auditLogger.getLogs();
        return logs.slice(0, limit).map(log => ({
            action: log.action,
            entityType: log.entityType,
            timestamp: log.timestamp,
            details: log.details
        }));
    }

    /**
     * Get overdue report
     * @returns {array} - Array of overdue books with details
     */
    getOverdueReport() {
        const overdue = this.borrowingSystem.getOverdueBooks();
        
        return overdue.map(transaction => {
            const book = this.books.find(b => b.id === transaction.bookId);
            const borrower = this.borrowingSystem.getBorrower(transaction.borrowerId);
            const dueDate = new Date(transaction.dueDate);
            const daysOverdue = Math.ceil((new Date() - dueDate) / (1000 * 60 * 60 * 24));
            const fine = this.borrowingSystem.calculateFine(transaction.id);

            return {
                transaction: transaction,
                book: book,
                borrower: borrower,
                dueDate: dueDate,
                daysOverdue: daysOverdue,
                fine: fine
            };
        }).sort((a, b) => b.daysOverdue - a.daysOverdue);
    }

    /**
     * Generate comprehensive report
     * @returns {object} - Complete report object
     */
    generateFullReport() {
        return {
            generatedAt: new Date().toISOString(),
            libraryStats: this.getLibraryStats(),
            popularBooks: this.getPopularBooks(10),
            borrowingTrends: {
                daily: this.getBorrowingTrends('daily'),
                weekly: this.getBorrowingTrends('weekly'),
                monthly: this.getBorrowingTrends('monthly'),
                yearly: this.getBorrowingTrends('yearly')
            },
            genreDistribution: this.getGenreDistribution(),
            borrowerActivity: this.getBorrowerActivity(10),
            overdueReport: this.getOverdueReport(),
            recentActivity: this.getRecentActivity(20)
        };
    }

    /**
     * Export report to JSON
     * @param {object} report - Report object
     * @returns {string} - JSON string
     */
    exportReportToJSON(report) {
        return JSON.stringify(report, null, 2);
    }

    /**
     * Export report to CSV
     * @param {string} reportType - Type of report
     * @returns {string} - CSV string
     */
    exportReportToCSV(reportType) {
        let data = [];
        let headers = [];

        switch (reportType) {
            case 'books':
                headers = ['Title', 'Author', 'ISBN', 'Genre', 'Status', 'Location', 'Date Added'];
                data = this.books.map(book => [
                    book.title,
                    book.author,
                    book.isbn || '',
                    book.genre || '',
                    book.status,
                    book.location || '',
                    new Date(book.dateAdded).toLocaleDateString()
                ]);
                break;

            case 'borrowers':
                headers = ['Name', 'Email', 'Phone', 'Total Borrows', 'Active Loans', 'Overdue'];
                const borrowers = this.getBorrowerActivity();
                data = borrowers.map(item => [
                    item.borrower.name,
                    item.borrower.email || '',
                    item.borrower.phone || '',
                    item.totalBorrows,
                    item.activeLoans,
                    item.overdueLoans
                ]);
                break;

            case 'transactions':
                headers = ['Book', 'Borrower', 'Checkout Date', 'Due Date', 'Return Date', 'Status', 'Fine'];
                data = this.borrowingSystem.transactions.map(transaction => {
                    const book = this.books.find(b => b.id === transaction.bookId);
                    const borrower = this.borrowingSystem.getBorrower(transaction.borrowerId);
                    return [
                        book ? book.title : 'Unknown',
                        borrower ? borrower.name : 'Unknown',
                        new Date(transaction.checkoutDate).toLocaleDateString(),
                        new Date(transaction.dueDate).toLocaleDateString(),
                        transaction.returnDate ? new Date(transaction.returnDate).toLocaleDateString() : '',
                        transaction.status,
                        transaction.fineAmount || 0
                    ];
                });
                break;

            case 'overdue':
                headers = ['Book', 'Borrower', 'Due Date', 'Days Overdue', 'Fine'];
                const overdue = this.getOverdueReport();
                data = overdue.map(item => [
                    item.book ? item.book.title : 'Unknown',
                    item.borrower ? item.borrower.name : 'Unknown',
                    item.dueDate.toLocaleDateString(),
                    item.daysOverdue,
                    item.fine.toFixed(2)
                ]);
                break;
        }

        // Generate CSV
        let csv = headers.join(',') + '\n';
        data.forEach(row => {
            const escapedRow = row.map(cell => {
                const str = String(cell || '');
                if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            csv += escapedRow.join(',') + '\n';
        });

        return csv;
    }
}

