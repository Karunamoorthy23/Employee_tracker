// Global variables
let BASE_URL = '';

// DOM Elements
const form = document.getElementById('progressForm');
const submitBtn = document.getElementById('submitBtn');
const clearBtn = document.getElementById('clearBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const fileInput = document.getElementById('fileAttachment');
const filePreview = document.getElementById('filePreview');

// New Overlay Elements
const submissionOverlay = document.getElementById('submissionOverlay');
const successState = document.getElementById('successState');
const failureState = document.getElementById('failureState');
const failureMessage = document.getElementById('failureMessage');
const newSubmissionBtn = document.getElementById('newSubmissionBtn');
const retryBtn = document.getElementById('retryBtn');

// Initialize BASE_URL and set current date
document.addEventListener('DOMContentLoaded', async function() {
    // Fetch BASE_URL from server
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        BASE_URL = config.BASE_URL;
        // Ensure BASE_URL ends with a trailing slash
        if (!BASE_URL.endsWith('/')) {
            BASE_URL += '/';
        }
    } catch (error) {
        console.error('Failed to fetch BASE_URL, using default:', error);
        BASE_URL = window.location.origin + '/';
    }
    
    const now = new Date();
    const dateInput = document.getElementById('date');
    
    // Set current date
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
});


// File upload handling
fileInput.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    console.log('Files selected:', files.length);
    
    // Clear previous selection and update with new files
    selectedFiles = [...files];
    
    displayFilePreview(selectedFiles);
});

// Drag and drop functionality
const fileUploadContainer = document.querySelector('.file-upload-container');

fileUploadContainer.addEventListener('dragover', function(e) {
    e.preventDefault();
    fileUploadContainer.style.borderColor = '#0056D2';
    fileUploadContainer.style.background = '#F0F4FF';
});

fileUploadContainer.addEventListener('dragleave', function(e) {
    e.preventDefault();
    fileUploadContainer.style.borderColor = '#CBD5E1';
    fileUploadContainer.style.background = '#FAFBFC';
});

fileUploadContainer.addEventListener('drop', function(e) {
    e.preventDefault();
    fileUploadContainer.style.borderColor = '#CBD5E1';
    fileUploadContainer.style.background = '#FAFBFC';
    
    const files = Array.from(e.dataTransfer.files);
    
    // Clear previous selection and update with new files
    selectedFiles = [...files];
    
    // Update the file input
    fileInput.files = e.dataTransfer.files;
    
    displayFilePreview(selectedFiles);
});

// Display file preview
function displayFilePreview(files) {
    if (files.length === 0) {
        filePreview.style.display = 'none';
        return;
    }
    
    filePreview.innerHTML = '';
    filePreview.style.display = 'block';
    
    // Add header showing file count
    const header = document.createElement('div');
    header.className = 'file-preview-header';
    header.innerHTML = `<strong>Selected Files (${files.length}):</strong>`;
    filePreview.appendChild(header);
    
    // Add a note about file removal
    if (files.length > 0) {
        const note = document.createElement('div');
        note.className = 'file-preview-note';
        note.innerHTML = '<small style="color: #64748B; font-style: italic;">Click the trash icon to remove files</small>';
        filePreview.appendChild(note);
    }
    
    files.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-preview-item';
        fileItem.setAttribute('data-file-index', index);
        
        const icon = getFileIcon(file.type);
        const size = formatFileSize(file.size);
        
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="${icon}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${size})</span>
            </div>
            <button type="button" class="remove-file-btn" data-file-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        // Add event listener for remove button
        const removeBtn = fileItem.querySelector('.remove-file-btn');
        removeBtn.addEventListener('click', function() {
            const fileIndex = parseInt(this.getAttribute('data-file-index'));
            console.log('Remove button clicked for file index:', fileIndex);
            console.log('Current selectedFiles before removal:', selectedFiles.length);
            removeFile(fileIndex);
        });
        
        filePreview.appendChild(fileItem);
    });
}

// Get file icon based on file type
function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) {
        return 'fas fa-image';
    } else if (fileType === 'application/pdf') {
        return 'fas fa-file-pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
        return 'fas fa-file-word';
    } else if (fileType.includes('zip') || fileType.includes('rar')) {
        return 'fas fa-file-archive';
    } else if (fileType.includes('text')) {
        return 'fas fa-file-alt';
    } else {
        return 'fas fa-file';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Global array to store selected files
let selectedFiles = [];

// Remove file from selection
function removeFile(index) {
    try {
        // Validate index
        if (index < 0 || index >= selectedFiles.length) {
            console.error('Invalid file index:', index);
            return;
        }
        
        // Remove file from our tracking array
        selectedFiles.splice(index, 1);
        
        // Clear the file input to prevent duplicates
        fileInput.value = '';
        
        // Refresh preview
        displayFilePreview(selectedFiles);
        
        console.log('File removed. Remaining files:', selectedFiles.length);
        
    } catch (error) {
        console.error('Error removing file:', error);
        // Fallback: just refresh the preview with current files
        displayFilePreview(selectedFiles);
    }
}

// Form submission
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Hide previous messages
    hideMessages();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        const formData = new FormData(form);
        
        // Add current timestamp to form data
        const currentTime = new Date().toISOString();
        formData.append('formSubmissionTime', currentTime);
        
        // Use our tracked files instead of file input
        const files = selectedFiles;
        console.log('Submitting with files:', files.length);
        
        // Remove any existing fileAttachment entries from FormData to avoid duplicates
        formData.delete('fileAttachment');
        
        // Manually add only our tracked files to FormData
        files.forEach((file, index) => {
            formData.append('fileAttachment', file);
        });
        
        // Check if files are properly attached
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                if (!files[i] || files[i].size === 0) {
                    showErrorMessage('One or more files appear to be corrupted. Please re-select your files.');
                    setLoadingState(false);
                    return;
                }
            }
        }
        
        // Log FormData files for debugging
        const formDataFiles = formData.getAll('fileAttachment');
        console.log('FormData files count:', formDataFiles.length);
        console.log('FormData file names:', formDataFiles.map(f => f.name));
        
        const response = await fetch(`${BASE_URL}api/employee-progress`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessState();
            form.reset();
            selectedFiles = []; // Clear our global files array
            filePreview.style.display = 'none';
            
            // Reset date to current
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            document.getElementById('date').value = `${year}-${month}-${day}`;
        } else {
            showFailureState(result.message || 'Failed to submit progress. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        showFailureState('Network error. Please check your connection and try again.');
    } finally {
        setLoadingState(false);
    }
});

// New Status Functions
function showSuccessState() {
    submissionOverlay.style.display = 'flex';
    successState.style.display = 'block';
    failureState.style.display = 'none';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function showFailureState(message) {
    submissionOverlay.style.display = 'flex';
    successState.style.display = 'none';
    failureState.style.display = 'block';
    failureMessage.textContent = message;
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

function closeOverlay() {
    submissionOverlay.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Overlay Button Listeners
newSubmissionBtn.addEventListener('click', closeOverlay);
retryBtn.addEventListener('click', closeOverlay);

// Form validation
function validateForm() {
    const requiredFields = [
        'internName',
        'internEmail',
        'internId',
        'internDomain',
        'date',
        'techLeadName',
        'assignedTask',
        'workStatus'
    ];
    
    let isValid = true;
    
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field.value.trim()) {
            field.style.borderColor = '#EF4444';
            isValid = false;
        } else {
            field.style.borderColor = '#E2E8F0';
        }
    });
    
    // Email validation
    const emailField = document.getElementById('internEmail');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailField.value && !emailRegex.test(emailField.value)) {
        emailField.style.borderColor = '#EF4444';
        showErrorMessage('Please enter a valid email address.');
        isValid = false;
    }
    
    // File size validation for multiple files
    const files = selectedFiles.length > 0 ? selectedFiles : Array.from(fileInput.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    for (let file of files) {
        if (file.size > maxSize) {
            showErrorMessage(`File "${file.name}" is too large. Maximum size is 5MB per file.`);
            isValid = false;
            break;
        }
    }
    
    // Check total number of files
    if (files.length > 10) {
        showErrorMessage('Maximum 10 files allowed per submission.');
        isValid = false;
    }
    
    if (!isValid) {
        showErrorMessage('Please fill in all required fields correctly.');
    }
    
    return isValid;
}

// Clear form
clearBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all form data?')) {
        form.reset();
        selectedFiles = []; // Clear our global files array
        filePreview.style.display = 'none';
        hideMessages();
        
        // Reset date to current
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        document.getElementById('date').value = `${year}-${month}-${day}`;
        
        // Reset field borders
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.borderColor = '#E2E8F0';
        });
    }
});

// Set loading state
function setLoadingState(loading) {
    const submitIcon = document.getElementById('submitIcon');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    if (loading) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitSpinner.style.display = 'block';
        submitSpinner.style.opacity = '1';
    } else {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitSpinner.style.display = 'none';
        submitSpinner.style.opacity = '0';
    }
}

// Show success message
function showSuccessMessage(message) {
    successMessage.querySelector('span').textContent = message;
    successMessage.style.display = 'flex';
    errorMessage.style.display = 'none';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 5000);
}

// Show error message
function showErrorMessage(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    successMessage.style.display = 'none';
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 8000);
}

// Hide all messages
function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Real-time validation
const inputs = form.querySelectorAll('input, select, textarea');
inputs.forEach(input => {
    input.addEventListener('blur', function() {
        if (this.hasAttribute('required') && !this.value.trim()) {
            this.style.borderColor = '#EF4444';
        } else {
            this.style.borderColor = '#E2E8F0';
        }
    });
    
    input.addEventListener('input', function() {
        if (this.style.borderColor === 'rgb(239, 68, 68)') {
            this.style.borderColor = '#E2E8F0';
        }
    });
});

// Email validation on input
document.getElementById('internEmail').addEventListener('input', function() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.value && !emailRegex.test(this.value)) {
        this.style.borderColor = '#EF4444';
    } else {
        this.style.borderColor = '#E2E8F0';
    }
});
