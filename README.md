# Proeduvate Employee Progress Tracking Portal

A complete web application for tracking employee daily progress submissions with an admin dashboard for management and oversight.

## 🚀 Features

### Employee Submission Form
- **Personal Information**: Name, Email, ID, Domain selection
- **Work Information**: Date, Time, Tech Lead, Assigned Task, Work Status
- **Progress Details**: Learning outcomes, work description, challenges, support needs
- **File Upload**: Support for PDF, DOC, images, and archive files (max 10MB)
- **Real-time Validation**: Form validation with user-friendly error messages
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Admin Dashboard
- **Overview Statistics**: Total submissions, completed tasks, in-progress work, pending items
- **Advanced Filtering**: Search by name/email/ID, filter by domain, tech lead, and status
- **Detailed View**: Modal popup with complete submission details and file previews
- **Pagination**: Efficient handling of large datasets
- **File Management**: Preview images and PDFs, download other file types

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer middleware
- **Styling**: Custom CSS with Proeduvate corporate theme

## 📋 Prerequisites

Before running the application, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (running on localhost:27017)
- **npm** (comes with Node.js)

## 🚀 Installation & Setup

### 1. Clone or Download the Project
```bash
# If using git
git clone <repository-url>
cd proeduvate-employee-progress-portal

# Or extract the downloaded files to a directory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### 4. Create the Database
The application will automatically create the `Proeduvate` database and `employee_progress` collection when you first submit data.

### 5. Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

### 6. Access the Application
- **Employee Form**: http://localhost:3001
- **Admin Dashboard**: http://localhost:3001/admin

## 📁 Project Structure

```
proeduvate-employee-progress-portal/
├── models/
│   └── EmployeeProgress.js          # Mongoose schema
├── public/
│   ├── index.html                   # Employee submission form
│   ├── style.css                    # Employee form styles
│   ├── script.js                    # Employee form JavaScript
│   ├── admin.html                   # Admin dashboard
│   ├── admin.css                    # Admin dashboard styles
│   └── admin.js                     # Admin dashboard JavaScript
├── uploads/                         # File upload directory (auto-created)
├── package.json                     # Dependencies and scripts
├── server.js                        # Express server and API routes
└── README.md                        # This file
```

## 🔧 Configuration

### Environment Variables
You can customize the application by setting these environment variables:

```bash
PORT=3001                           # Server port (default: 3001)
MONGODB_URI=mongodb://localhost:27017/Proeduvate  # MongoDB connection string
```

### File Upload Settings
- **Maximum file size**: 10MB
- **Allowed file types**: PDF, DOC, DOCX, JPG, PNG, GIF, ZIP, RAR, TXT
- **Upload directory**: `./uploads/`

## 📊 Database Schema

### EmployeeProgress Collection
```javascript
{
  internName: String (required),
  internEmail: String (required, unique),
  internId: String (required),
  internDomain: String (required, enum),
  date: Date (required),
  time: String (required),
  techLeadName: String (required, enum),
  assignedTask: String (required),
  workStatus: String (required, enum),
  learnedToday: String,
  workDescription: String,
  challengesFaced: String,
  supportRequired: String,
  fileAttachment: {
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  },
  submissionTimestamp: Date (auto-generated)
}
```

## 🎨 Design Features

### Proeduvate Corporate Theme
- **Primary Color**: #0056D2 (Blue)
- **Secondary Color**: #F0F4FF (Light Blue)
- **Accent Color**: #1E293B (Dark Gray)
- **Typography**: Inter font family
- **Icons**: Font Awesome 6.0

### Responsive Design
- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interface
- Optimized for all screen sizes

## 🔒 Security Features

- Input validation and sanitization
- File type and size restrictions
- CORS protection
- Error handling without sensitive data exposure
- MongoDB injection prevention through Mongoose

## 📈 Performance Features

- Pagination for large datasets
- Debounced search functionality
- Optimized database queries with indexes
- Efficient file handling
- Lazy loading of modal content

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running on localhost:27017
   - Check if the database service is started

2. **File Upload Issues**
   - Verify the uploads directory has write permissions
   - Check file size (max 10MB) and type restrictions

3. **Port Already in Use**
   - Change the PORT environment variable
   - Kill the process using the port: `lsof -ti:3001 | xargs kill -9`

4. **Dependencies Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=proeduvate:* npm start
```

## 📝 API Endpoints

### POST /api/employee-progress
Submit a new progress entry
- **Body**: FormData with all form fields and optional file
- **Response**: Success/error message with submission details

### GET /api/employee-progress
Get all progress entries (for admin dashboard)
- **Query Parameters**: search, domain, techLead, page, limit
- **Response**: Paginated list of submissions

### GET /api/employee-progress/:id
Get a specific progress entry by ID
- **Response**: Complete submission details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

© 2025 Proeduvate Pvt Ltd. All Rights Reserved.

## 📞 Support

For technical support or questions, please contact the development team at Proeduvate.

---

**Built with ❤️ for Proeduvate**
