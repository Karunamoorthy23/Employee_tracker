require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const session = require('express-session');

const EmployeeProgress = require('./models/EmployeeProgress');

const app = express();
const PORT = process.env.PORT || 5000;
let BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Ensure localhost URLs always use http, not https
if (BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1')) {
  BASE_URL = BASE_URL.replace(/^https:/, 'http:');
}

// Middleware
// CORS configuration - allow multiple origins for Render deployments
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    const origins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    // Always include BASE_URL even if in ALLOWED_ORIGINS
    const baseUrl = BASE_URL.replace(/\/$/, '');
    if (!origins.includes(baseUrl)) {
      origins.push(baseUrl);
    }
    return origins;
  }
  
  // Default: allow BASE_URL
  return [BASE_URL.replace(/\/$/, '')];
};

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = getAllowedOrigins();
    const baseUrlOrigin = BASE_URL.replace(/\/$/, '').replace(/^https?:\/\//, '');
    
    // Allow if origin matches BASE_URL (same domain)
    if (origin.includes(baseUrlOrigin)) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list (exact match)
    const isAllowed = allowedOrigins.some(allowed => {
      const allowedClean = allowed.replace(/\/$/, '').replace(/^https?:\/\//, '');
      const originClean = origin.replace(/\/$/, '').replace(/^https?:\/\//, '');
      
      // Exact match
      if (origin === allowed || originClean === allowedClean) {
        return true;
      }
      
      // Allow all Render subdomains in production
      if (process.env.NODE_ENV === 'production' && 
          origin.includes('onrender.com') && 
          allowed.includes('onrender.com')) {
        return true;
      }
      
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS: Blocked origin "${origin}". Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'proeduvate-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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
  console.log('🔌 Using MONGODB_URI from environment variables');
} else if (process.env.CLUSTERNAME && process.env.USERNAME && process.env.PASSWORD) {
  // Construct MongoDB URI from individual components
  const clusterName = process.env.CLUSTERNAME;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  const provider = process.env.PROVIDER || 'mongodb.net'; // Default to MongoDB Atlas
  
  mongoUri = `mongodb+srv://${username}:${password}@${clusterName}.${provider}/Proeduvate?retryWrites=true&w=majority`;
  console.log('🔌 Using MongoDB Atlas connection (constructed from CLUSTERNAME, USERNAME, PASSWORD)');
  console.log(`   Cluster: ${clusterName}`);
  console.log(`   Username: ${username}`);
} else {
  // Fallback to local MongoDB
  mongoUri = 'mongodb://localhost:27017/Proeduvate';
  console.log('🔌 Using local MongoDB (fallback)');
  console.log('   💡 To use MongoDB Atlas, set MONGODB_URI or CLUSTERNAME/USERNAME/PASSWORD in .env');
}

// Mask password in logs for security
const maskedUri = mongoUri.replace(/:\/\/[^:]+:([^@]+)@/, '://***:***@');
console.log(`📡 Attempting to connect to MongoDB...`);
console.log(`   Connection string: ${maskedUri}`);

// MongoDB connection with minimal options to avoid compatibility issues
mongoose.connect(mongoUri)
.then(() => {
  console.log('Connected to MongoDB successfully');
  console.log(`Database: ${mongoUri.includes('localhost') ? 'Local MongoDB' : 'Cloud MongoDB'}`);
})
.catch((error) => {
  console.error('\n❌ MongoDB connection error:', error.message);
  console.error(`   Error type: ${error.name}`);
  
  if (error.name === 'MongooseServerSelectionError') {
    console.error('\n🔴 MOST LIKELY ISSUE: IP Address Not Whitelisted');
    console.error('\n🔧 Quick Fix Steps:');
    console.error('   1. Go to: https://cloud.mongodb.com');
    console.error('   2. Click "Network Access" (left sidebar)');
    console.error('   3. Click "Add IP Address"');
    console.error('   4. For development: Add "0.0.0.0/0" (allows all IPs)');
    console.error('   5. For production: Click "Add Current IP Address"');
    console.error('   6. Wait 1-2 minutes, then restart your server');
    console.error('\n   Other possible causes:');
    console.error('   - Cluster is paused (check MongoDB Atlas dashboard)');
    console.error('   - Wrong cluster name in connection string');
    console.error('   - Network/firewall blocking MongoDB connections');
  }
  
  if (error.name === 'MongoAuthenticationError' || error.message.includes('Authentication failed')) {
    console.error('\n🔴 AUTHENTICATION FAILED');
    console.error('\n🔧 Check:');
    console.error('   1. Username is correct (case-sensitive)');
    console.error('   2. Password is correct');
    console.error('   3. Password has special characters? URL encode them!');
    console.error('      @ → %40, # → %23, % → %25, & → %26');
    console.error('   4. Database user exists in MongoDB Atlas → Database Access');
  }
  
  if (error.name === 'MongoParseError' || error.message.includes('parse')) {
    console.error('\n🔴 CONNECTION STRING FORMAT ERROR');
    console.error('\n🔧 Fix:');
    console.error('   1. Check your MONGODB_URI format');
    console.error('   2. Ensure special characters in password are URL encoded');
    console.error('   3. Format: mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DBNAME');
    console.error('\n   Get correct connection string:');
    console.error('   - MongoDB Atlas → Connect → Connect your application → Copy string');
  }
  
  if (error.message && (error.message.includes('SSL') || error.message.includes('TLS'))) {
    console.error('\n🔴 SSL/TLS CONNECTION ISSUE');
    console.error('\n🔧 Try adding to your connection string:');
    console.error('   ?ssl=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true');
  }
  
  if (error.message && error.message.includes('timeout')) {
    console.error('\n🔴 CONNECTION TIMEOUT');
    console.error('\n🔧 Possible causes:');
    console.error('   1. Cluster is paused - Resume it in MongoDB Atlas');
    console.error('   2. Network/firewall blocking connection');
    console.error('   3. IP not whitelisted');
  }
  
  console.error('\n📚 For detailed troubleshooting, see: MONGODB_TROUBLESHOOTING.md');
  console.error('\n💡 Temporary workaround: Use local MongoDB');
  console.error('   Set in .env: MONGODB_URI=mongodb://localhost:27017/Proeduvate');
  
  // Don't exit immediately, allow server to start and retry connection
  console.error('\n⚠️  Server will continue running but database operations will fail until connection is established.');
  console.error('   Mongoose will attempt to reconnect automatically when connection is available.');
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin login route
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Admin login API
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    req.session.adminUser = username;
    res.json({
      success: true,
      message: 'Login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Admin logout API
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});

// Check authentication status
app.get('/api/admin/auth-status', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.json({
      success: true,
      authenticated: true,
      user: req.session.adminUser
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

// Protected admin route
app.get('/admin', (req, res) => {
  if (req.session && req.session.isAuthenticated) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.redirect('/admin-login');
  }
});

// API endpoint to get BASE_URL for client-side
app.get('/api/config', (req, res) => {
  // Fix localhost URLs - always use http, not https
  let baseUrl = BASE_URL;
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    baseUrl = baseUrl.replace(/^https:/, 'http:');
  }
  // Ensure BASE_URL ends with a trailing slash
  baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  res.json({
    BASE_URL: baseUrl
  });
});

// Connection status check
const checkConnection = () => {
  return mongoose.connection.readyState === 1;
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAuthenticated) {
    return next();
  } else {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.LOGIN_USERNAME || 'Login@proEduvate';
const ADMIN_PASSWORD = process.env.LOGIN_PASSWORD || 'Pass@proEduvate';

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

// Get all employee progress (for admin dashboard) - Protected route
app.get('/api/employee-progress', requireAuth, async (req, res) => {
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

    // Handle 'all' limit to fetch all records
    let queryLimit;
    let skip;
    if (limit === 'all' || limit === 'All') {
      queryLimit = null; // No limit
      skip = 0; // No pagination when fetching all
    } else {
      queryLimit = parseInt(limit);
      skip = (parseInt(page) - 1) * queryLimit;
    }
    
    let query = EmployeeProgress.find(filter)
      .sort({ submissionTimestamp: -1 })
      .select('-__v');
    
    if (skip > 0) {
      query = query.skip(skip);
    }
    
    if (queryLimit) {
      query = query.limit(queryLimit);
    }
    
    const progressEntries = await query;

    const totalCount = await EmployeeProgress.countDocuments(filter);

    // Calculate pagination info
    let paginationInfo;
    if (limit === 'all' || limit === 'All') {
      paginationInfo = {
        currentPage: 1,
        totalPages: 1,
        totalCount,
        hasNext: false,
        hasPrev: false
      };
    } else {
      const limitNum = parseInt(limit);
      paginationInfo = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNext: skip + progressEntries.length < totalCount,
        hasPrev: parseInt(page) > 1
      };
    }

    res.json({
      success: true,
      data: progressEntries,
      pagination: paginationInfo
    });

  } catch (error) {
    console.error('Error fetching progress entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Get single progress entry by ID - Protected route
app.get('/api/employee-progress/:id', requireAuth, async (req, res) => {
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

// Delete a specific file from a progress entry - Protected route
app.delete('/api/employee-progress/:id/files/:fileName', requireAuth, async (req, res) => {
  try {
    const { id, fileName } = req.params;
    
    // Check if MongoDB is connected
    if (!checkConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please try again later.'
      });
    }
    
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

    // Find the file attachment to delete
    const fileIndex = progressEntry.fileAttachments.findIndex(file => file.fileName === fileName);
    
    if (fileIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const fileToDelete = progressEntry.fileAttachments[fileIndex];
    const filePath = path.join(__dirname, 'uploads', fileToDelete.fileName);

    // Remove file from filesystem
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`File deleted from filesystem: ${filePath}`);
      }
    } catch (fileError) {
      console.error('Error deleting file from filesystem:', fileError);
      // Continue with database update even if file deletion fails
    }

    // Remove file from database
    progressEntry.fileAttachments.splice(fileIndex, 1);
    await progressEntry.save();

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: {
        deletedFile: fileToDelete.originalName,
        remainingFiles: progressEntry.fileAttachments.length
      }
    });

  } catch (error) {
    console.error('Error deleting file:', error);
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
