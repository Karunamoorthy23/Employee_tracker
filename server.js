require('dotenv').config({ override: true });
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const session = require('express-session');

const EmployeeProgress = require('./models/EmployeeProgress');
const AttendanceMailLog = require('./models/AttendanceMailLog');

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

const parseJsonEnv = (value, fallback = {}) => {
  if (!value || !value.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    console.warn('⚠️ Failed to parse JSON environment value. Using fallback.');
    return fallback;
  }
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatDateOnly = (date) => new Date(date).toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

const toStartOfDay = (date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate;
};

const toEndOfDay = (date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(23, 59, 59, 999);
  return normalizedDate;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getDateDifferenceInDays = (startDate, endDate) => {
  const start = toStartOfDay(startDate).getTime();
  const end = toStartOfDay(endDate).getTime();
  const diff = Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
  return diff + 1;
};

const parseDateInput = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const departmentHeadEmails = parseJsonEnv(process.env.DEPARTMENT_HEAD_EMAILS, {});
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpSecure = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

const createMailer = () => {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

const mailer = createMailer();

const normalizeDepartmentKey = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const departmentEmailLookup = Object.entries(departmentHeadEmails).reduce((lookup, [departmentName, email]) => {
  lookup[normalizeDepartmentKey(departmentName)] = email;
  return lookup;
}, {});

const buildAttendanceWindow = async (options = {}) => {
  const requestedStartDate = parseDateInput(options.startDate);
  const requestedEndDate = parseDateInput(options.endDate);

  if (requestedStartDate || requestedEndDate) {
    return {
      periodStart: requestedStartDate ? toStartOfDay(requestedStartDate) : null,
      periodEnd: requestedEndDate ? toEndOfDay(requestedEndDate) : toEndOfDay(new Date()),
      latestLog: null,
      windowLabel: 'custom'
    };
  }

  const periodEnd = toEndOfDay(new Date());
  const periodStart = toStartOfDay(addDays(periodEnd, -13));

  return {
    periodStart,
    periodEnd,
    latestLog: null,
    windowLabel: 'last-14-days'
  };
};

const buildAttendanceReport = async (periodStart, periodEnd) => {
  const allRecords = await EmployeeProgress.find({})
    .select('internName internEmail internId internDomain date')
    .sort({ internDomain: 1, internName: 1, date: 1 })
    .lean();

  const windowRecords = await EmployeeProgress.find({
    date: {
      $gte: periodStart,
      $lte: periodEnd
    }
  })
    .select('internName internEmail internId internDomain date')
    .sort({ internDomain: 1, internName: 1, date: 1 })
    .lean();

  const departmentsMap = new Map();
  const possibleAttendanceDays = getDateDifferenceInDays(periodStart, periodEnd);

  const getStudentKey = (record) => record.internId || record.internEmail || record.internName;

  for (const record of allRecords) {
    const departmentName = record.internDomain || 'Unknown';
    const studentKey = getStudentKey(record);

    if (!departmentsMap.has(departmentName)) {
      departmentsMap.set(departmentName, new Map());
    }

    const departmentStudents = departmentsMap.get(departmentName);

    if (!departmentStudents.has(studentKey)) {
      departmentStudents.set(studentKey, {
        internName: record.internName,
        internEmail: record.internEmail,
        internId: record.internId,
        internDomain: departmentName,
        attendanceDates: new Set(),
        submissionCount: 0,
        lastSubmissionDate: null,
        firstSeenDate: record.date ? new Date(record.date) : null
      });
    }
  }

  for (const record of windowRecords) {
    const departmentName = record.internDomain || 'Unknown';
    const studentKey = getStudentKey(record);
    const dateKey = new Date(record.date).toISOString().slice(0, 10);

    if (!departmentsMap.has(departmentName)) {
      departmentsMap.set(departmentName, new Map());
    }

    const departmentStudents = departmentsMap.get(departmentName);

    if (!departmentStudents.has(studentKey)) {
      departmentStudents.set(studentKey, {
        internName: record.internName,
        internEmail: record.internEmail,
        internId: record.internId,
        internDomain: departmentName,
        attendanceDates: new Set(),
        submissionCount: 0
      });
    }

    const student = departmentStudents.get(studentKey);
    student.attendanceDates.add(dateKey);
    student.submissionCount += 1;
    student.lastSubmissionDate = record.date ? new Date(record.date) : student.lastSubmissionDate;
    if (!student.firstSeenDate && record.date) {
      student.firstSeenDate = new Date(record.date);
    }
  }

  return [...departmentsMap.entries()].map(([departmentName, studentsMap]) => {
    const students = [...studentsMap.values()]
      .map((student) => ({
        ...student,
        attendanceDates: [...student.attendanceDates].sort(),
        attendanceDays: student.attendanceDates.size,
        attendanceRate: possibleAttendanceDays > 0 ? Math.round((student.attendanceDates.size / possibleAttendanceDays) * 100) : 0,
        attendanceStatus: student.attendanceDates.size === 0
          ? 'No Attendance'
          : Math.round((student.attendanceDates.size / possibleAttendanceDays) * 100) >= 75
            ? 'Good Attendance'
            : 'Low Attendance'
      }))
      .sort((left, right) => {
        const statusOrder = {
          'No Attendance': 0,
          'Low Attendance': 1,
          'Good Attendance': 2
        };

        const statusDiff = statusOrder[left.attendanceStatus] - statusOrder[right.attendanceStatus];
        if (statusDiff !== 0) {
          return statusDiff;
        }

        return left.internName.localeCompare(right.internName);
      });

    const noAttendanceStudents = students.filter((student) => student.attendanceStatus === 'No Attendance');
    const lowAttendanceStudents = students.filter((student) => student.attendanceStatus === 'Low Attendance');
    const goodAttendanceStudents = students.filter((student) => student.attendanceStatus === 'Good Attendance');
    const averageAttendanceRate = students.length > 0
      ? Math.round(students.reduce((sum, student) => sum + student.attendanceRate, 0) / students.length)
      : 0;

    return {
      departmentName,
      recipientEmail: departmentEmailLookup[normalizeDepartmentKey(departmentName)] || '',
      students,
      studentCount: students.length,
      totalAttendanceDays: students.reduce((sum, student) => sum + student.attendanceDays, 0),
      totalSubmissions: students.reduce((sum, student) => sum + student.submissionCount, 0),
      averageAttendanceRate,
      possibleAttendanceDays,
      noAttendanceCount: noAttendanceStudents.length,
      lowAttendanceCount: lowAttendanceStudents.length,
      goodAttendanceCount: goodAttendanceStudents.length,
      noAttendanceStudents,
      lowAttendanceStudents,
      goodAttendanceStudents,
      anomalies: [...noAttendanceStudents, ...lowAttendanceStudents]
    };
  }).sort((left, right) => left.departmentName.localeCompare(right.departmentName));
};

const renderAttendanceEmailHtml = (departmentReport, periodStart, periodEnd) => {
  const studentRows = departmentReport.students.length > 0
    ? departmentReport.students.map((student) => `
      <tr>
        <td>${escapeHtml(student.internName)}</td>
        <td>${escapeHtml(student.internId)}</td>
        <td>${escapeHtml(student.internEmail)}</td>
        <td>${student.attendanceDays}</td>
        <td>${escapeHtml(student.attendanceDates.join(', ') || 'No attendance in this period')}</td>
        <td>${student.attendanceRate}%</td>
        <td>${escapeHtml(student.attendanceStatus)}</td>
        <td>${student.submissionCount}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="8" style="text-align:center;padding:18px;color:#64748b;">No attendance records were found for this period.</td>
      </tr>
    `;

  const anomalyRows = departmentReport.anomalies.length > 0
    ? departmentReport.anomalies.map((student) => `
      <tr>
        <td>${escapeHtml(student.internName)}</td>
        <td>${escapeHtml(student.internId)}</td>
        <td>${student.attendanceDays}</td>
        <td>${student.attendanceRate}%</td>
        <td>${escapeHtml(student.attendanceStatus)}</td>
        <td>${escapeHtml(student.attendanceDates.join(', ') || 'No attendance in this period')}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="6" style="text-align:center;padding:18px;color:#64748b;">No attendance anomalies found.</td>
      </tr>
    `;

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 12px;">Department Attendance Report - ${escapeHtml(departmentReport.departmentName)}</h2>
      <p style="margin:0 0 18px;">Period: ${escapeHtml(formatDateOnly(periodStart))} to ${escapeHtml(formatDateOnly(periodEnd))}</p>
      <p style="margin:0 0 18px;">Attendance days are counted from distinct progress submission dates in the selected window. The roster includes all known students in this department, so no-attendance cases are visible too.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 18px;">
        <div style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;"><strong>${departmentReport.studentCount}</strong><br/>Students</div>
        <div style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;"><strong>${departmentReport.averageAttendanceRate}%</strong><br/>Average Attendance</div>
        <div style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;"><strong>${departmentReport.goodAttendanceCount}</strong><br/>Good</div>
        <div style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;"><strong>${departmentReport.lowAttendanceCount}</strong><br/>Low</div>
        <div style="padding:12px 16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;"><strong>${departmentReport.noAttendanceCount}</strong><br/>No Attendance</div>
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Student</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">ID</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Email</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Attendance Days</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Attendance Dates</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Attendance %</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Status</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Submissions</th>
          </tr>
        </thead>
        <tbody>
          ${studentRows}
        </tbody>
      </table>
      <h3 style="margin:24px 0 10px;">Anomalies</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Student</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">ID</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Days</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Attendance %</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Status</th>
            <th style="padding:10px;border:1px solid #e2e8f0;text-align:left;">Dates</th>
          </tr>
        </thead>
        <tbody>
          ${anomalyRows}
        </tbody>
      </table>
      <p style="margin:18px 0 0;color:#475569;">Summary: ${departmentReport.studentCount} students, ${departmentReport.totalAttendanceDays} attendance days, ${departmentReport.totalSubmissions} submissions.</p>
    </div>
  `;
};

const renderAttendanceEmailText = (departmentReport, periodStart, periodEnd) => {
  const lines = [
    `Department Attendance Report - ${departmentReport.departmentName}`,
    `Period: ${formatDateOnly(periodStart)} to ${formatDateOnly(periodEnd)}`,
    'Attendance days are counted from distinct progress submission dates in the selected window.',
    `Students: ${departmentReport.studentCount}`,
    `Average attendance: ${departmentReport.averageAttendanceRate}%`,
    `Good attendance: ${departmentReport.goodAttendanceCount}`,
    `Low attendance: ${departmentReport.lowAttendanceCount}`,
    `No attendance: ${departmentReport.noAttendanceCount}`,
    ''
  ];

  if (departmentReport.students.length === 0) {
    lines.push('No attendance records were found for this period.');
    return lines.join('\n');
  }

  for (const student of departmentReport.students) {
    lines.push(`${student.internName} | ${student.internId} | ${student.internEmail} | ${student.attendanceDays} day(s) | ${student.attendanceRate}% | ${student.attendanceStatus} | ${student.attendanceDates.join(', ') || 'No attendance in this period'} | ${student.submissionCount} submission(s)`);
  }

  lines.push('');
  lines.push(`Summary: ${departmentReport.studentCount} students, ${departmentReport.totalAttendanceDays} attendance days, ${departmentReport.totalSubmissions} submissions.`);
  lines.push('');
  lines.push('Anomalies:');
  if (departmentReport.anomalies.length === 0) {
    lines.push('None');
  } else {
    for (const student of departmentReport.anomalies) {
      lines.push(`${student.internName} | ${student.internId} | ${student.attendanceRate}% | ${student.attendanceStatus} | ${student.attendanceDates.join(', ') || 'No attendance in this period'}`);
    }
  }

  return lines.join('\n');
};

const getDepartmentMailSummary = async (options = {}) => {
  const { periodStart, periodEnd, latestLog } = await buildAttendanceWindow(options);
  const departments = await buildAttendanceReport(periodStart, periodEnd);
  const configuredDepartments = Object.keys(departmentHeadEmails);
  const missingRecipients = departments
    .filter((department) => !department.recipientEmail)
    .map((department) => department.departmentName);

  return {
    periodStart,
    periodEnd,
    latestLog,
    departments,
    configuredDepartments,
    missingRecipients,
    smtpReady: !!mailer
  };
};

app.get('/api/admin/attendance-mail/preview', requireAuth, async (req, res) => {
  try {
    if (!checkConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not available.'
      });
    }

    const summary = await getDepartmentMailSummary({
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating attendance preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate attendance preview.'
    });
  }
});

app.post('/api/admin/attendance-mail/send', requireAuth, async (req, res) => {
  try {
    if (!checkConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not available.'
      });
    }

    if (!mailer) {
      return res.status(503).json({
        success: false,
        message: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in .env.'
      });
    }

    // Use performSend to handle the send logic so it can be reused by scheduler
    const options = {
      startDate: req.body?.startDate || req.query?.startDate,
      endDate: req.body?.endDate || req.query?.endDate,
      department: req.body?.department || req.query?.department,
      recipientEmail: req.body?.recipientEmail || req.query?.recipientEmail
    };

    const result = await performSend(options, req.session?.adminUser || ADMIN_USERNAME);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message || 'Failed to send attendance reports.' });
    }

    res.json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    console.error('Error sending attendance mail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send attendance mail.'
    });
  }
});

// performSend: reusable send function used by manual API and scheduler
async function performSend(options = {}, sentBy = 'system') {
  try {
    if (!checkConnection()) {
      return { success: false, message: 'Database connection is not available.' };
    }

    if (!mailer) {
      return { success: false, message: 'SMTP is not configured.' };
    }

    const summary = await getDepartmentMailSummary({ startDate: options.startDate, endDate: options.endDate });

    if (!summary || summary.departments.length === 0) {
      return { success: false, message: 'No attendance records were found for the selected period.' };
    }

    // Filter departments based on options.department or recipientEmail
    let departmentsToSend = summary.departments;
    if (options.department && String(options.department).trim() !== '') {
      const deptKey = String(options.department).trim();
      departmentsToSend = departmentsToSend.filter(d => d.departmentName === deptKey || normalizeDepartmentKey(d.departmentName) === normalizeDepartmentKey(deptKey));
    }

    if (options.recipientEmail && String(options.recipientEmail).trim() !== '') {
      // If recipientEmail provided, send only to that email for selected department(s)
      departmentsToSend = departmentsToSend.map(d => ({ ...d, recipientEmail: String(options.recipientEmail).trim() }));
    }

    // If no recipient email configured for selected departments, fail
    const withRecipients = departmentsToSend.filter(d => d.recipientEmail && d.recipientEmail.trim() !== '');

    if (withRecipients.length === 0) {
      return { success: false, message: 'No recipient emails found for the selected department(s).' };
    }

    const sendResults = await Promise.allSettled(withRecipients.map(async (department) => {
      const html = renderAttendanceEmailHtml(department, summary.periodStart, summary.periodEnd);
      const text = renderAttendanceEmailText(department, summary.periodStart, summary.periodEnd);
      const subject = `Attendance Report - ${department.departmentName} (${formatDateOnly(summary.periodStart)} to ${formatDateOnly(summary.periodEnd)})`;

      await mailer.sendMail({ from: smtpFrom, to: department.recipientEmail, subject, text, html });

      return { departmentName: department.departmentName, recipientEmail: department.recipientEmail };
    }));

    const successfulSends = [];
    const failedSends = [];

    sendResults.forEach((result, index) => {
      const department = withRecipients[index];
      if (result.status === 'fulfilled') {
        successfulSends.push(result.value);
      } else {
        failedSends.push({ departmentName: department.departmentName, recipientEmail: department.recipientEmail, message: result.reason?.message || 'Failed to send email' });
      }
    });

    const logStatus = failedSends.length === 0 ? 'success' : successfulSends.length > 0 ? 'partial' : 'failed';

    await AttendanceMailLog.create({
      reportType: 'department-attendance',
      periodStart: summary.periodStart,
      periodEnd: summary.periodEnd,
      sentAt: new Date(),
      recipientCount: successfulSends.length,
      recipientEmails: successfulSends.map((entry) => entry.recipientEmail),
      departmentCount: summary.departments.length,
      status: logStatus,
      sentBy: sentBy,
      summary: {
        configuredDepartments: summary.configuredDepartments.length,
        missingRecipients: summary.missingRecipients
      }
    });

    return {
      success: true,
      message: failedSends.length === 0 ? 'Attendance reports sent successfully.' : 'Attendance reports sent with some failures.',
      data: {
        sentCount: successfulSends.length,
        failedCount: failedSends.length,
        missingRecipients: summary.missingRecipients,
        failedSends,
        periodStart: summary.periodStart,
        periodEnd: summary.periodEnd
      }
    };
  } catch (error) {
    console.error('performSend error:', error);
    return { success: false, message: 'Failed to send attendance reports.' };
  }
}

// Scheduler: every Friday at 09:00 server time, but only send if last successful send was >= 13 days ago
try {
  cron.schedule('0 9 * * 5', async () => {
    try {
      console.log('Scheduler: Friday job running - checking if send is needed');
      const lastLog = await AttendanceMailLog.findOne({ reportType: 'department-attendance', status: 'success' }).sort({ sentAt: -1 }).lean();
      const now = Date.now();
      if (lastLog && lastLog.sentAt) {
        const diffDays = Math.floor((now - new Date(lastLog.sentAt).getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays < 13) {
          console.log(`Scheduler: Last successful send was ${diffDays} day(s) ago. Skipping (need >=13 days).`);
          return;
        }
      }

      const result = await performSend({}, 'scheduler');
      console.log('Scheduler run result:', result);
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  }, { timezone: 'Asia/Kolkata' });
  console.log('Scheduler: configured to run every Friday at 09:00 IST (Asia/Kolkata)');
} catch (err) {
  console.error('Failed to configure scheduler:', err);
}

// Get summary statistics - Protected route
app.get('/api/employee-progress/stats', requireAuth, async (req, res) => {
  try {
    if (!checkConnection()) {
      return res.status(503).json({
        success: false,
        message: 'Database connection is not available.'
      });
    }

    const filter = buildFilter(req.query);
    
    const [total, completed, inProgress, pending] = await Promise.all([
      EmployeeProgress.countDocuments(filter),
      EmployeeProgress.countDocuments({ ...filter, workStatus: 'Completed' }),
      EmployeeProgress.countDocuments({ ...filter, workStatus: 'In Progress' }),
      EmployeeProgress.countDocuments({ ...filter, workStatus: 'Pending' })
    ]);

    res.json({
      success: true,
      data: {
        total,
        completed,
        inProgress,
        pending
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to build MongoDB filter object from query parameters
const buildFilter = (query) => {
  const { search, domain, techLead, status, dateFrom, dateTo } = query;
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

  if (status && status !== 'all') {
    filter.workStatus = status;
  }

  // Date filtering
  if ((dateFrom && dateFrom.trim() !== '') || (dateTo && dateTo.trim() !== '')) {
    filter.date = {};
    if (dateFrom && dateFrom.trim() !== '') {
      const fromDate = new Date(dateFrom);
      if (!isNaN(fromDate.getTime())) {
        filter.date.$gte = fromDate;
      }
    }
    if (dateTo && dateTo.trim() !== '') {
      const toDate = new Date(dateTo);
      if (!isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }
    // If we added filter.date but no valid dates were provided, remove it
    if (Object.keys(filter.date).length === 0) {
      delete filter.date;
    }
  }
  
  return filter;
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
    
    const { page = 1, limit = 40 } = req.query;
    const filter = buildFilter(req.query);
    
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
app.get('/api/employee-progress/:id([0-9a-fA-F]{24})', requireAuth, async (req, res) => {
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
app.delete('/api/employee-progress/:id([0-9a-fA-F]{24})/files/:fileName', requireAuth, async (req, res) => {
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
