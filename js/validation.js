/**
 * Input Validation and Sanitization Utilities
 * Provides secure input validation and XSS prevention
 */

class Validator {
    /**
     * Sanitize string input to prevent XSS attacks
     * @param {string} input - User input string
     * @returns {string} - Sanitized string
     */
    static sanitize(input) {
        if (typeof input !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML.trim();
    }

    /**
     * Validate ISBN format (ISBN-10 or ISBN-13)
     * @param {string} isbn - ISBN to validate
     * @returns {boolean} - True if valid ISBN
     */
    static validateISBN(isbn) {
        if (!isbn) return true; // ISBN is optional
        
        // Remove hyphens and spaces
        const cleanISBN = isbn.replace(/[-\s]/g, '');
        
        // Check if it's ISBN-10 (10 digits) or ISBN-13 (13 digits starting with 978 or 979)
        if (cleanISBN.length === 10) {
            return /^\d{9}[\dX]$/i.test(cleanISBN);
        } else if (cleanISBN.length === 13) {
            return /^(978|979)\d{10}$/.test(cleanISBN);
        }
        
        return false;
    }

    /**
     * Validate publication year
     * @param {number|string} year - Publication year
     * @returns {boolean} - True if valid year
     */
    static validateYear(year) {
        if (!year) return true; // Year is optional
        const yearNum = parseInt(year);
        const currentYear = new Date().getFullYear();
        return yearNum >= 1000 && yearNum <= currentYear + 1;
    }

    /**
     * Validate required field
     * @param {string} value - Field value
     * @param {string} fieldName - Field name for error message
     * @returns {object} - {valid: boolean, error: string}
     */
    static validateRequired(value, fieldName) {
        if (!value || value.trim().length === 0) {
            return {
                valid: false,
                error: `${fieldName} is required`
            };
        }
        return { valid: true, error: null };
    }

    /**
     * Validate string length
     * @param {string} value - Field value
     * @param {number} min - Minimum length
     * @param {number} max - Maximum length
     * @param {string} fieldName - Field name for error message
     * @returns {object} - {valid: boolean, error: string}
     */
    static validateLength(value, min, max, fieldName) {
        if (value && (value.length < min || value.length > max)) {
            return {
                valid: false,
                error: `${fieldName} must be between ${min} and ${max} characters`
            };
        }
        return { valid: true, error: null };
    }

    /**
     * Validate book data
     * @param {object} bookData - Book data object
     * @returns {object} - {valid: boolean, errors: array}
     */
    static validateBook(bookData) {
        const errors = [];

        // Validate title
        const titleCheck = this.validateRequired(bookData.title, 'Title');
        if (!titleCheck.valid) errors.push(titleCheck.error);
        else {
            const titleLength = this.validateLength(bookData.title, 1, 255, 'Title');
            if (!titleLength.valid) errors.push(titleLength.error);
        }

        // Validate author
        const authorCheck = this.validateRequired(bookData.author, 'Author');
        if (!authorCheck.valid) errors.push(authorCheck.error);
        else {
            const authorLength = this.validateLength(bookData.author, 1, 255, 'Author');
            if (!authorLength.valid) errors.push(authorLength.error);
        }

        // Validate ISBN
        if (bookData.isbn && !this.validateISBN(bookData.isbn)) {
            errors.push('Invalid ISBN format. Please use ISBN-10 or ISBN-13 format.');
        }

        // Validate publication year
        if (bookData.publicationYear && !this.validateYear(bookData.publicationYear)) {
            errors.push('Invalid publication year. Year must be between 1000 and ' + (new Date().getFullYear() + 1));
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check for duplicate ISBN
     * @param {string} isbn - ISBN to check
     * @param {array} books - Array of existing books
     * @param {string} excludeId - Book ID to exclude from check (for updates)
     * @returns {boolean} - True if duplicate found
     */
    static isDuplicateISBN(isbn, books, excludeId = null) {
        if (!isbn) return false;
        return books.some(book => 
            book.isbn && 
            book.isbn.toLowerCase() === isbn.toLowerCase() && 
            book.id !== excludeId
        );
    }
}

