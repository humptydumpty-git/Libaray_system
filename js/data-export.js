/**
 * Data Export/Import Utilities
 * Handles exporting and importing library data
 */

class DataExporter {
    /**
     * Export books to JSON
     * @param {array} books - Array of books
     * @returns {string} - JSON string
     */
    static exportToJSON(books) {
        return JSON.stringify(books, null, 2);
    }

    /**
     * Export books to CSV
     * @param {array} books - Array of books
     * @returns {string} - CSV string
     */
    static exportToCSV(books) {
        if (books.length === 0) return '';

        // Get headers from first book
        const headers = Object.keys(books[0]);
        
        // Create CSV header row
        let csv = headers.join(',') + '\n';

        // Add data rows
        books.forEach(book => {
            const row = headers.map(header => {
                let value = book[header] || '';
                // Escape commas and quotes in CSV
                if (typeof value === 'string') {
                    value = value.replace(/"/g, '""'); // Escape quotes
                    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                        value = `"${value}"`;
                    }
                }
                return value;
            });
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Download data as file
     * @param {string} content - File content
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Export books to JSON file
     * @param {array} books - Array of books
     * @param {string} filename - Optional filename
     */
    static exportBooksToJSON(books, filename = null) {
        const json = this.exportToJSON(books);
        const date = new Date().toISOString().split('T')[0];
        const finalFilename = filename || `library-books-${date}.json`;
        this.downloadFile(json, finalFilename, 'application/json');
    }

    /**
     * Export books to CSV file
     * @param {array} books - Array of books
     * @param {string} filename - Optional filename
     */
    static exportBooksToCSV(books, filename = null) {
        const csv = this.exportToCSV(books);
        const date = new Date().toISOString().split('T')[0];
        const finalFilename = filename || `library-books-${date}.csv`;
        this.downloadFile(csv, finalFilename, 'text/csv');
    }

    /**
     * Import books from JSON
     * @param {string} jsonString - JSON string
     * @returns {object} - {success: boolean, books: array, errors: array}
     */
    static importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const books = Array.isArray(data) ? data : [data];
            
            const errors = [];
            const validBooks = [];

            books.forEach((book, index) => {
                const validation = Validator.validateBook(book);
                if (validation.valid) {
                    // Ensure book has required fields
                    if (!book.id) {
                        book.id = Date.now().toString() + index;
                    }
                    if (!book.dateAdded) {
                        book.dateAdded = new Date().toISOString();
                    }
                    validBooks.push(book);
                } else {
                    errors.push(`Book ${index + 1}: ${validation.errors.join(', ')}`);
                }
            });

            return {
                success: errors.length === 0,
                books: validBooks,
                errors: errors
            };
        } catch (e) {
            return {
                success: false,
                books: [],
                errors: ['Invalid JSON format: ' + e.message]
            };
        }
    }

    /**
     * Import books from CSV
     * @param {string} csvString - CSV string
     * @returns {object} - {success: boolean, books: array, errors: array}
     */
    static importFromCSV(csvString) {
        const lines = csvString.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            return {
                success: false,
                books: [],
                errors: ['CSV file must have at least a header row and one data row']
            };
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const books = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length !== headers.length) {
                errors.push(`Row ${i + 1}: Column count mismatch`);
                continue;
            }

            const book = {};
            headers.forEach((header, index) => {
                book[header] = values[index] ? values[index].trim() : '';
            });

            const validation = Validator.validateBook(book);
            if (validation.valid) {
                if (!book.id) {
                    book.id = Date.now().toString() + i;
                }
                if (!book.dateAdded) {
                    book.dateAdded = new Date().toISOString();
                }
                books.push(book);
            } else {
                errors.push(`Row ${i + 1}: ${validation.errors.join(', ')}`);
            }
        }

        return {
            success: errors.length === 0,
            books: books,
            errors: errors
        };
    }

    /**
     * Create backup of all library data
     * @param {object} data - Library data object
     * @returns {string} - JSON backup string
     */
    static createBackup(data) {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: data
        };
        return JSON.stringify(backup, null, 2);
    }

    /**
     * Restore from backup
     * @param {string} backupString - Backup JSON string
     * @returns {object} - {success: boolean, data: object, error: string}
     */
    static restoreFromBackup(backupString) {
        try {
            const backup = JSON.parse(backupString);
            if (!backup.data) {
                return {
                    success: false,
                    data: null,
                    error: 'Invalid backup format: missing data'
                };
            }
            return {
                success: true,
                data: backup.data,
                error: null
            };
        } catch (e) {
            return {
                success: false,
                data: null,
                error: 'Invalid backup format: ' + e.message
            };
        }
    }
}

