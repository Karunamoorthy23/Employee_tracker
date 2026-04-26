require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const EmployeeProgress = require('./models/EmployeeProgress');

async function deleteEntriesByEmail(email) {
    try {
        console.log(`📡 Connecting to MongoDB...`);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');

        // Find all records with this email to handle file deletions
        const records = await EmployeeProgress.find({ internEmail: email.toLowerCase() });
        
        if (records.length === 0) {
            console.log(`ℹ️ No records found for email: ${email}`);
            process.exit(0);
        }

        console.log(`🔍 Found ${records.length} records for ${email}. Cleaning up files...`);

        // Delete files from uploads folder
        for (const record of records) {
            if (record.fileAttachments && record.fileAttachments.length > 0) {
                for (const file of record.fileAttachments) {
                    const filePath = path.join(__dirname, 'uploads', file.fileName);
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            console.log(`   🗑️ Deleted file: ${file.fileName}`);
                        }
                    } catch (err) {
                        console.error(`   ❌ Error deleting file ${file.fileName}:`, err.message);
                    }
                }
            }
        }

        // Delete records from database
        const result = await EmployeeProgress.deleteMany({ internEmail: email.toLowerCase() });
        console.log(`✅ Successfully deleted ${result.deletedCount} database records for ${email}`);

    } catch (error) {
        console.error('❌ Error during deletion process:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
    }
}

const targetEmail = 'karunamoorthy@gmail.com';
deleteEntriesByEmail(targetEmail);
