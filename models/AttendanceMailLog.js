const mongoose = require('mongoose');

const attendanceMailLogSchema = new mongoose.Schema({
  reportType: {
    type: String,
    required: true,
    default: 'department-attendance'
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  recipientEmails: [{
    type: String,
    trim: true
  }],
  departmentCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  sentBy: {
    type: String,
    trim: true
  },
  summary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

attendanceMailLogSchema.index({ reportType: 1, sentAt: -1 });

module.exports = mongoose.model('AttendanceMailLog', attendanceMailLogSchema);