/**
 * Advanced Search and Filtering System
 * Provides comprehensive search capabilities with multiple criteria
 */

class AdvancedSearch {
    constructor(books, borrowingSystem) {
        this.books = books;
        this.borrowingSystem = borrowingSystem;
    }

    /**
     * Perform advanced search with multiple criteria
     * @param {object} criteria - Search criteria
     * @returns {array} - Filtered books
     */
    search(criteria) {
        let results = [...this.books];

        // Text search (title, author, ISBN)
        if (criteria.text) {
            const searchTerm = criteria.text.toLowerCase();
            results = results.filter(book => {
                const titleMatch = book.title && book.title.toLowerCase().includes(searchTerm);
                const authorMatch = book.author && book.author.toLowerCase().includes(searchTerm);
                const isbnMatch = book.isbn && book.isbn.toLowerCase().includes(searchTerm);
                const genreMatch = book.genre && book.genre.toLowerCase().includes(searchTerm);
                const locationMatch = book.location && book.location.toLowerCase().includes(searchTerm);
                
                return titleMatch || authorMatch || isbnMatch || genreMatch || locationMatch;
            });
        }

        // Genre filter
        if (criteria.genres && criteria.genres.length > 0) {
            results = results.filter(book => criteria.genres.includes(book.genre));
        }

        // Status filter
        if (criteria.statuses && criteria.statuses.length > 0) {
            results = results.filter(book => criteria.statuses.includes(book.status));
        }

        // Publication year range
        if (criteria.yearFrom || criteria.yearTo) {
            results = results.filter(book => {
                if (!book.publicationYear) return false;
                const year = parseInt(book.publicationYear);
                const from = criteria.yearFrom ? parseInt(criteria.yearFrom) : 1000;
                const to = criteria.yearTo ? parseInt(criteria.yearTo) : new Date().getFullYear() + 1;
                return year >= from && year <= to;
            });
        }

        // Date added range
        if (criteria.dateAddedFrom || criteria.dateAddedTo) {
            results = results.filter(book => {
                if (!book.dateAdded) return false;
                const bookDate = new Date(book.dateAdded);
                const from = criteria.dateAddedFrom ? new Date(criteria.dateAddedFrom) : new Date(0);
                const to = criteria.dateAddedTo ? new Date(criteria.dateAddedTo) : new Date();
                return bookDate >= from && bookDate <= to;
            });
        }

        // Availability filter (based on borrowing system)
        if (criteria.availability !== undefined) {
            if (criteria.availability === 'available') {
                results = results.filter(book => {
                    const activeTransactions = this.borrowingSystem.getActiveTransactions(book.id);
                    return book.status === 'Available' && activeTransactions.length === 0;
                });
            } else if (criteria.availability === 'borrowed') {
                results = results.filter(book => {
                    const activeTransactions = this.borrowingSystem.getActiveTransactions(book.id);
                    return book.status === 'Borrowed' || activeTransactions.length > 0;
                });
            } else if (criteria.availability === 'overdue') {
                results = results.filter(book => {
                    const activeTransactions = this.borrowingSystem.getActiveTransactions(book.id);
                    return activeTransactions.some(t => {
                        const dueDate = new Date(t.dueDate);
                        return dueDate < new Date();
                    });
                });
            }
        }

        // Sort results
        if (criteria.sortBy) {
            results = this.sortResults(results, criteria.sortBy, criteria.sortOrder || 'asc');
        }

        return results;
    }

    /**
     * Sort results
     * @param {array} results - Results to sort
     * @param {string} sortBy - Field to sort by
     * @param {string} order - Sort order (asc/desc)
     * @returns {array} - Sorted results
     */
    sortResults(results, sortBy, order = 'asc') {
        const sorted = [...results];
        const multiplier = order === 'desc' ? -1 : 1;

        sorted.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            // Handle null/undefined values
            if (aVal === null || aVal === undefined) aVal = '';
            if (bVal === null || bVal === undefined) bVal = '';

            // Handle dates
            if (sortBy === 'dateAdded' || sortBy === 'publicationYear') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            }

            // Handle strings
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return -1 * multiplier;
            if (aVal > bVal) return 1 * multiplier;
            return 0;
        });

        return sorted;
    }

    /**
     * Get search suggestions based on input
     * @param {string} query - Search query
     * @param {number} limit - Maximum suggestions
     * @returns {array} - Array of suggestions
     */
    getSuggestions(query, limit = 5) {
        if (!query || query.length < 2) return [];

        const lowerQuery = query.toLowerCase();
        const suggestions = new Set();

        this.books.forEach(book => {
            if (book.title && book.title.toLowerCase().includes(lowerQuery)) {
                suggestions.add(book.title);
            }
            if (book.author && book.author.toLowerCase().includes(lowerQuery)) {
                suggestions.add(book.author);
            }
            if (book.genre && book.genre.toLowerCase().includes(lowerQuery)) {
                suggestions.add(book.genre);
            }
        });

        return Array.from(suggestions).slice(0, limit);
    }

    /**
     * Get available genres
     * @returns {array} - Array of unique genres
     */
    getAvailableGenres() {
        const genres = new Set();
        this.books.forEach(book => {
            if (book.genre) genres.add(book.genre);
        });
        return Array.from(genres).sort();
    }

    /**
     * Get search statistics
     * @param {array} results - Search results
     * @returns {object} - Statistics object
     */
    getSearchStats(results) {
        const stats = {
            totalResults: results.length,
            byGenre: {},
            byStatus: {},
            byYear: {},
            averageYear: null
        };

        let totalYear = 0;
        let yearCount = 0;

        results.forEach(book => {
            // Count by genre
            const genre = book.genre || 'Unknown';
            stats.byGenre[genre] = (stats.byGenre[genre] || 0) + 1;

            // Count by status
            const status = book.status || 'Unknown';
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

            // Count by year (decade)
            if (book.publicationYear) {
                const year = parseInt(book.publicationYear);
                const decade = Math.floor(year / 10) * 10;
                stats.byYear[decade] = (stats.byYear[decade] || 0) + 1;
                totalYear += year;
                yearCount++;
            }
        });

        if (yearCount > 0) {
            stats.averageYear = Math.round(totalYear / yearCount);
        }

        return stats;
    }
}

