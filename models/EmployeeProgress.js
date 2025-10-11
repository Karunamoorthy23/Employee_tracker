const mongoose = require('mongoose');

const employeeProgressSchema = new mongoose.Schema({
  internName: {
    type: String,
    required: true,
    trim: true
  },
  internEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  internId: {
    type: String,
    required: true,
    trim: true
  },
  internDomain: {
    type: String,
    required: true,
    enum: ['Full Stack', 'Frontend', 'Backend', 'AIML', 'Database Management', 'Cloud Technologies', 'Cyber Security', 'Data Engineering', 'Data Visualization', 'Testing', 'Others']
  },
  date: {
    type: Date,
    required: true
  },
  techLeadName: {
    type: String,
    required: true,
    enum: ['Balamanikandan', 'Karunamoorthy S', 'Dharshini', 'Dhanush Chakravarthy', 'Gowtham', 'Dowlath Nisha', 'KarunaKaran', 'Sachin', 'Martin']
  },
  assignedTask: {
    type: String,
    required: true,
    trim: true
  },
  workStatus: {
    type: String,
    required: true,
    enum: ['Completed', 'In Progress', 'Pending', 'Blocked', 'On Hold']
  },
  learnedToday: {
    type: String,
    trim: true
  },
  workDescription: {
    type: String,
    trim: true
  },
  challengesFaced: {
    type: String,
    trim: true
  },
  supportRequired: {
    type: String,
    trim: true
  },
  fileAttachments: [{
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String
  }],
  submissionTimestamp: {
    type: Date,
    default: Date.now
  },
  formSubmissionTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
employeeProgressSchema.index({ internEmail: 1 });
employeeProgressSchema.index({ internDomain: 1 });
employeeProgressSchema.index({ techLeadName: 1 });
employeeProgressSchema.index({ date: -1 });

module.exports = mongoose.model('EmployeeProgress', employeeProgressSchema);
