# Library Management System - Professional Edition

A comprehensive, secure, and feature-rich library management system with enhanced security, borrowing management, and professional features.

## Features

### Core Features
- ✅ **Book Management**: Add, edit, delete, and search books
- ✅ **Advanced Search**: Search by title, author, ISBN with genre and status filters
- ✅ **Real-time Statistics**: Track total books, available books, and borrowed books
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Security Features
- 🔒 **Input Validation**: Comprehensive validation for all user inputs
- 🔒 **XSS Prevention**: All inputs are sanitized to prevent cross-site scripting attacks
- 🔒 **ISBN Validation**: Validates ISBN-10 and ISBN-13 formats
- 🔒 **Duplicate Detection**: Prevents duplicate books by ISBN
- 🔒 **Audit Logging**: Complete audit trail of all system actions

### Borrowing Management
- 📚 **Borrower Registration**: Register and manage library members
- 📚 **Check Out System**: Check out books with due dates
- 📚 **Return System**: Return books and calculate fines for overdue items
- 📚 **Overdue Tracking**: Track and view overdue books
- 📚 **Fine Calculation**: Automatic fine calculation for overdue books

### Data Management
- 💾 **Export Functionality**: Export books to JSON or CSV format
- 💾 **Import Functionality**: Import books from JSON or CSV files
- 💾 **Backup & Restore**: Create complete backups and restore from backups
- 💾 **Audit Log Export**: Export audit logs for compliance and review

### Professional Features
- 📊 **Statistics Dashboard**: View library statistics and analytics
- 📊 **Settings Management**: Configure loan periods and fine amounts
- 📊 **Data Validation**: Comprehensive data validation on all operations
- 📊 **Error Handling**: User-friendly error messages and notifications

## File Structure

```
Library_system/
├── library.html          # Main application file
├── library.css           # Stylesheet
├── js/
│   ├── validation.js     # Input validation and sanitization
│   ├── audit-logger.js   # Audit logging system
│   ├── borrowing-system.js # Borrowing management
│   └── data-export.js    # Export/import functionality
├── DEVELOPMENT_ROADMAP.md # Development roadmap and recommendations
└── README.md             # This file
```

## Getting Started

1. **Clone or download** this repository
2. **Open** `library.html` in a modern web browser
3. **Start managing** your library!

No installation or server setup required - it runs entirely in your browser using localStorage.

## Usage Guide

### Adding Books
1. Click on "Add Book" tab
2. Fill in the required fields (Title and Author are mandatory)
3. Optionally add ISBN, genre, publication year, location
4. Click "Add Book" to save

### Searching Books
1. Click on "Search Books" tab
2. Enter search terms in the search box
3. Use genre and status filters to narrow results
4. Results update in real-time as you type

### Borrowing Books
1. Click on "Borrowing" tab
2. Register borrowers if needed
3. Click "Check Out Book" to check out a book
4. Select book and borrower, set loan period
5. Click "Return Book" to return checked out books

### Exporting Data
1. Click on "Reports" tab
2. Click "Export to JSON" or "Export to CSV"
3. File will download automatically

### Creating Backups
1. Click on "Reports" tab
2. Click "Create Backup"
3. Backup file will be downloaded
4. To restore, click "Restore from Backup" and select your backup file

## Security Best Practices

- All user inputs are validated and sanitized
- ISBN numbers are validated for correct format
- Duplicate books are prevented
- All actions are logged in the audit trail
- Data is stored locally in browser (consider backend for production)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## Data Storage

All data is stored in browser localStorage:
- `libraryBooks`: Book catalog
- `borrowers`: Registered borrowers
- `transactions`: Borrowing transactions
- `auditLogs`: System audit logs

**Note**: Data is stored locally in your browser. Clearing browser data will delete all library information. Regular backups are recommended.

## Future Enhancements

See `DEVELOPMENT_ROADMAP.md` for detailed plans including:
- User authentication system
- Backend API integration
- Database migration
- Advanced reporting
- Email notifications
- And more...

## Contributing

Contributions are welcome! Please refer to the development roadmap for areas that need improvement.

## License

GNU General Public License v3.0

## Support

For issues, questions, or feature requests, please open an issue in the repository.

---

**Version**: 2.0 (Professional Edition)  
**Last Updated**: 2024
