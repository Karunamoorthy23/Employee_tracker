require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const EmployeeProgress = require('./models/EmployeeProgress');

const app = express();
const PORT = process.env.PORT;
const BASE_URL = process.env.BASE_URL;

// Middleware
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [BASE_URL.replace(/\/$/, '')],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow specific file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|zip|rar|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, documents, and archives are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB limit per file
    files: parseInt(process.env.MAX_FILES) || 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

// MongoDB connection
let mongoUri;
if (process.env.MONGODB_URI) {
  // Use direct MONGODB_URI if provided
  mongoUri = process.env.MONGODB_URI;
} else if (process.env.CLUSTERNAME && process.env.USERNAME && process.env.PASSWORD) {
  // Construct MongoDB URI from individual components
  const clusterName = process.env.CLUSTERNAME;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  const provider = process.env.PROVIDER || 'mongodb.net'; // Default to MongoDB Atlas
  
  mongoUri = `mongodb+srv://${username}:${password}@${clusterName}.${provider}/Proeduvate?retryWrites=true&w=majority`;
} else {
  // Fallback to local MongoDB
  mongoUri = 'mongodb://localhost:27017/Proeduvate';
}

// MongoDB connection with minimal options to avoid compatibility issues
mongoose.connect(mongoUri)
.then(() => {
  console.log('Connected to MongoDB successfully');
  console.log(`Database: ${mongoUri.includes('localhost') ? 'Local MongoDB' : 'Cloud MongoDB'}`);
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  
  if (error.name === 'MongooseServerSelectionError') {
    console.error('\n🔧 Troubleshooting MongoDB Atlas Connection:');
    console.error('1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.error('2. Go to: https://cloud.mongodb.com → Network Access → Add IP Address');
    console.error('3. Add your current IP or use 0.0.0.0/0 for all IPs (development only)');
    console.error('4. Verify your cluster is running and accessible');
    console.error('5. Check your username and password are correct');
  }
  
  if (error.message && (error.message.includes('SSL') || error.message.includes('TLS'))) {
    console.error('\n🔧 SSL/TLS Connection Issues:');
    console.error('1. Try adding these parameters to your MongoDB URI:');
    console.error('   ?ssl=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true');
    console.error('2. Example: mongodb+srv://user:pass@cluster.mongodb.net/db?ssl=true&tlsAllowInvalidCertificates=true');
    console.error('3. Verify your MongoDB Atlas cluster allows connections from your IP');
    console.error('4. Ensure your MongoDB user has proper permissions');
  }
  
  if (error.name === 'MongoParseError') {
    console.error('\n🔧 MongoDB URI Parse Error:');
    console.error('1. Check your MongoDB connection string format');
    console.error('2. Ensure all special characters in password are URL encoded');
    console.error('3. Verify the connection string is properly formatted');
  }
  
  console.error('\n💡 For local development, you can also use local MongoDB:');
  console.error('   Set MONGODB_URI=mongodb://localhost:27017/Proeduvate in your .env file');
  
  // Don't exit immediately, allow server to start and retry connection
  console.error('\n⚠️  Server will continue running but database operations will fail until connection is established.');
  console.error('   The server will attempt to reconnect automatically.');
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API endpoint to get BASE_URL for client-side
app.get('/api/config', (req, res) => {
  res.json({
    BASE_URL: BASE_URL
  });
});

// Connection status check
const checkConnection = () => {
  return mongoose.connection.readyState === 1;
};

// API Routes
// Submit employee progress
app.post('/api/employee-progress', upload.array('fileAttachment', 10), async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!checkConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please try again later.'
      });
    }
    const {
      internName,
      internEmail,
      internId,
      internDomain,
      date,
      techLeadName,
      assignedTask,
      workStatus,
      learnedToday,
      workDescription,
      challengesFaced,
      supportRequired,
      formSubmissionTime
    } = req.body;

    // Validation
    if (!internName || !internEmail || !internId || !internDomain || !date || !techLeadName || !assignedTask || !workStatus) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(internEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Prepare file data if uploaded
    let fileAttachments = [];
    if (req.files && req.files.length > 0) {
      fileAttachments = req.files.map(file => ({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype
      }));
    }
    

    // Create new progress entry
    const progressEntry = new EmployeeProgress({
      internName,
      internEmail,
      internId,
      internDomain,
      date: new Date(date),
      techLeadName,
      assignedTask,
      workStatus,
      learnedToday,
      workDescription,
      challengesFaced,
      supportRequired,
      fileAttachments: fileAttachments,
      formSubmissionTime: formSubmissionTime ? new Date(formSubmissionTime) : new Date() // Use client timestamp or current time
    });

    await progressEntry.save();

    res.status(201).json({
      success: true,
      message: 'Progress submitted successfully',
      data: {
        id: progressEntry._id,
        internName: progressEntry.internName,
        submissionDate: progressEntry.submissionTimestamp
      }
    });

  } catch (error) {
    console.error('Error submitting progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Get all employee progress (for admin dashboard)
app.get('/api/employee-progress', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (!checkConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please try again later.'
      });
    }
    const { search, domain, techLead, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    let filter = {};
    
    if (search) {
      filter.$or = [
        { internName: { $regex: search, $options: 'i' } },
        { internEmail: { $regex: search, $options: 'i' } },
        { internId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (domain && domain !== 'all') {
      filter.internDomain = domain;
    }
    
    if (techLead && techLead !== 'all') {
      filter.techLeadName = techLead;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const progressEntries = await EmployeeProgress.find(filter)
      .sort({ submissionTimestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const totalCount = await EmployeeProgress.countDocuments(filter);

    res.json({
      success: true,
      data: progressEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + progressEntries.length < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching progress entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Get single progress entry by ID
app.get('/api/employee-progress/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    const progressEntry = await EmployeeProgress.findById(id);
    
    if (!progressEntry) {
      return res.status(404).json({
        success: false,
        message: 'Progress entry not found'
      });
    }

    res.json({
      success: true,
      data: progressEntry
    });

  } catch (error) {
    console.error('Error fetching progress entry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB per file.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed per submission.'
      });
    }
  }
  
  if (error.message === 'Invalid file type. Only images, PDFs, documents, and archives are allowed.') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error. Please try again later.'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  const baseUrl = BASE_URL.replace(/\/$/, '');
  console.log(`Server is running on ${baseUrl}`);
  console.log(`Employee form: ${baseUrl}`);
  console.log(`Admin dashboard: ${baseUrl}/admin`);
});
