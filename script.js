// Custom cursor movement
const cursor = document.querySelector('.custom-cursor');
const cursorDot = document.querySelector('.custom-cursor-dot');

let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
let dotX = 0;
let dotY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Smooth cursor movement
function animateCursor() {
    // Cursor ring movement
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    // Cursor dot movement
    dotX += (mouseX - dotX) * 0.3;
    dotY += (mouseY - dotY) * 0.3;
    cursorDot.style.left = dotX + 'px';
    cursorDot.style.top = dotY + 'px';

    requestAnimationFrame(animateCursor);
}

animateCursor();

// Cursor hover effect
const interactiveElements = document.querySelectorAll('a, button, input, textarea');
interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursor.style.width = '30px';
        cursor.style.height = '30px';
        cursorDot.style.width = '6px';
        cursorDot.style.height = '6px';
    });

    element.addEventListener('mouseleave', () => {
        cursor.style.width = '20px';
        cursor.style.height = '20px';
        cursorDot.style.width = '4px';
        cursorDot.style.height = '4px';
    });

    element.addEventListener('mousedown', () => {
        cursor.style.width = '15px';
        cursor.style.height = '15px';
        cursorDot.style.width = '3px';
        cursorDot.style.height = '3px';
    });

    element.addEventListener('mouseup', () => {
        cursor.style.width = '30px';
        cursor.style.height = '30px';
        cursorDot.style.width = '6px';
        cursorDot.style.height = '6px';
    });
});

// Initialize particles.js
particlesJS('particles-js', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#ffffff' },
        shape: { type: 'circle' },
        opacity: { value: 0.5, random: false },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: '#ffffff', opacity: 0.4, width: 1 },
        move: { enable: true, speed: 6, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
    },
    interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
        modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 } }
    },
    retina_detect: true
});

// Store issued certificates in localStorage
const certificates = JSON.parse(localStorage.getItem('certificates')) || {};

// Toast notification with enhanced styling
const showToast = (message, type = 'info') => {
    const toast = document.getElementById('notificationToast');
    const toastBody = toast.querySelector('.toast-body');
    toastBody.textContent = message;
    toast.classList.add(`bg-${type}`);

    // Add icon based on type
    const icon = document.createElement('i');
    icon.className = `fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'} me-2`;
    toastBody.insertBefore(icon, toastBody.firstChild);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    setTimeout(() => {
        toast.classList.remove(`bg-${type}`);
        icon.remove();
    }, 5000);
};

// Loading spinner with enhanced animation
const showLoading = (show = true) => {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.style.display = 'flex';
        spinner.classList.add('fade-in');
    } else {
        spinner.classList.remove('fade-in');
        setTimeout(() => spinner.style.display = 'none', 300);
    }
};

// Check if Petra wallet is installed
const checkPetraWallet = () => {
    if (!window.petra) {
        showToast('Please install Petra Wallet to use this application', 'warning');
        window.open('https://petra.app/', '_blank');
        return false;
    }
    return true;
};

// Connect to Petra wallet with enhanced feedback
const connectWallet = async() => {
    if (!checkPetraWallet()) return;

    try {
        showLoading(true);
        const response = await window.petra.connect();
        const address = response.address;
        const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

        const walletBtn = document.getElementById('connectWallet');
        walletBtn.innerHTML = `
            <i class="fas fa-wallet"></i> Connected: ${shortAddress}
            <span class="badge bg-success ms-2">Active</span>
        `;
        walletBtn.disabled = true;
        walletBtn.classList.add('btn-success');

        showToast('Wallet connected successfully!', 'success');
        updateRecentCertificates();
    } catch (error) {
        console.error('Error connecting to wallet:', error);
        showToast('Failed to connect wallet. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
};

// Handle certificate issuance with preview
const handleCertificateSubmit = async(e) => {
    e.preventDefault();
    if (!window.petra.isConnected()) {
        showToast('Please connect your wallet first', 'warning');
        return;
    }

    const certificateId = document.getElementById('certificateId').value;
    const errorDiv = document.getElementById('certificateIdError');

    // Check for duplicate certificate
    if (certificates[certificateId]) {
        errorDiv.textContent = 'This certificate ID already exists. Please use a different ID.';
        errorDiv.style.display = 'block';
        return;
    }

    const certificateData = {
        certificate_id: certificateId,
        recipient: document.getElementById('recipient').value,
        issue_date: document.getElementById('issueDate').value,
        details: document.getElementById('details').value,
        issuer: await window.petra.account(),
        timestamp: new Date().toISOString(),
        download_count: 0 // Initialize download counter
    };

    try {
        showLoading(true);
        certificates[certificateId] = certificateData;
        localStorage.setItem('certificates', JSON.stringify(certificates));

        showCertificatePreview(certificateData);
        showToast('Certificate issued successfully!', 'success');
        e.target.reset();
        errorDiv.style.display = 'none';
        updateRecentCertificates();
    } catch (error) {
        console.error('Error issuing certificate:', error);
        showToast('Failed to issue certificate. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
};

// Show certificate preview
const showCertificatePreview = (certificate) => {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'certificate-preview fade-in';
    previewDiv.innerHTML = `
        <h4><i class="fas fa-certificate"></i> Certificate Preview</h4>
        <p><strong>ID:</strong> ${certificate.certificate_id}</p>
        <p><strong>Recipient:</strong> ${certificate.recipient}</p>
        <p><strong>Issue Date:</strong> ${new Date(certificate.issue_date).toLocaleDateString()}</p>
        <p><strong>Details:</strong> ${certificate.details}</p>
    `;

    const form = document.getElementById('certificateForm');
    form.appendChild(previewDiv);

    setTimeout(() => previewDiv.remove(), 5000);
};

// Handle certificate verification with enhanced display
const handleVerificationSubmit = async(e) => {
    e.preventDefault();
    const certificateId = document.getElementById('verifyCertificateId').value;
    const resultDiv = document.getElementById('verificationResult');

    try {
        showLoading(true);

        // Check if certificate exists in local storage
        const certificate = certificates[certificateId];

        if (certificate) {
            // Certificate exists locally
            resultDiv.innerHTML = `
                <div class="glass-card fade-in">
                    <div class="card-header">
                        <h4><i class="fas fa-check-circle text-success"></i> Certificate Verified</h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Recipient:</strong> ${certificate.recipient}</p>
                                <p><strong>Issue Date:</strong> ${new Date(certificate.issue_date).toLocaleDateString()}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Issuer:</strong> ${certificate.issuer}</p>
                                <p><strong>Details:</strong> ${certificate.details}</p>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-outline-light" onclick="downloadCertificate('${certificateId}')">
                                <i class="fas fa-download"></i> Download Certificate
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Certificate not found
            resultDiv.innerHTML = `
                <div class="glass-card fade-in">
                    <div class="card-header">
                        <h4><i class="fas fa-times-circle text-danger"></i> Certificate Not Found</h4>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i> This certificate ID does not exist in our records.
                        </div>
                        <p>Please verify the certificate ID and try again.</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error verifying certificate:', error);
        resultDiv.innerHTML = `
            <div class="alert alert-danger fade-in">
                <i class="fas fa-exclamation-circle"></i> Error verifying certificate. Please try again.
            </div>
        `;
    } finally {
        showLoading(false);
    }
};

// Download certificate as PDF
const downloadCertificate = (certificateId) => {
    const certificate = certificates[certificateId];
    if (!certificate) return;

    // Increment download counter
    certificate.download_count = (certificate.download_count || 0) + 1;
    localStorage.setItem('certificates', JSON.stringify(certificates));

    // Create PDF content with better styling
    const content = `
        <div style="
            text-align: center;
            padding: 40px;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #4CAF50;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        ">
            <div style="margin-bottom: 30px;">
                <img src="https://cdn-icons-png.flaticon.com/512/2436/2436874.png" 
                     alt="Certificate Icon" 
                     style="width: 80px; height: 80px; margin-bottom: 20px;">
                <h1 style="color: #2c3e50; margin-bottom: 20px; font-size: 36px;">
                    Certificate of Completion
                </h1>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background: rgba(255,255,255,0.8); border-radius: 5px;">
                <p style="font-size: 18px; color: #34495e; margin-bottom: 15px;">
                    This is to certify that
                </p>
                <h2 style="color: #2c3e50; font-size: 32px; margin: 20px 0; text-transform: uppercase;">
                    ${certificate.recipient}
                </h2>
                <p style="font-size: 18px; color: #34495e; margin-bottom: 20px;">
                    has successfully completed the requirements
                </p>
            </div>

            <div style="margin: 30px 0; padding: 20px; background: rgba(255,255,255,0.8); border-radius: 5px;">
                <p style="font-size: 16px; color: #7f8c8d; margin: 5px 0;">
                    <strong>Issue Date:</strong> ${new Date(certificate.issue_date).toLocaleDateString()}
                </p>
                <p style="font-size: 16px; color: #7f8c8d; margin: 5px 0;">
                    <strong>Certificate ID:</strong> ${certificate.certificate_id}
                </p>
                <p style="font-size: 16px; color: #7f8c8d; margin: 5px 0;">
                    <strong>Issuer:</strong> ${certificate.issuer}
                </p>
                <p style="font-size: 16px; color: #7f8c8d; margin: 5px 0;">
                    <strong>Details:</strong> ${certificate.details}
                </p>
                <p style="font-size: 16px; color: #7f8c8d; margin: 5px 0;">
                    <strong>Times Downloaded:</strong> ${certificate.download_count}
                </p>
            </div>

            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="font-size: 14px; color: #95a5a6;">
                    This certificate was issued digitally and can be verified through our platform.
                </p>
            </div>
        </div>
    `;

    // Create and download PDF
    const element = document.createElement('div');
    element.innerHTML = content;
    document.body.appendChild(element);

    const opt = {
        margin: 1,
        filename: `certificate-${certificateId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(element);
        showToast(`Certificate downloaded successfully! (${certificate.download_count} downloads)`, 'success');
        updateRecentCertificates(); // Update the table to show new download count
    }).catch(error => {
        console.error('Error generating PDF:', error);
        document.body.removeChild(element);
        showToast('Error downloading certificate. Please try again.', 'error');
    });
};

// Update recent certificates table with animations
const updateRecentCertificates = () => {
    const tbody = document.getElementById('recentCertificatesBody');
    const recentCerts = Object.values(certificates)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

    tbody.innerHTML = recentCerts.map((cert, index) => `
        <tr class="fade-in" style="animation-delay: ${index * 0.1}s">
            <td>${cert.certificate_id}</td>
            <td>${cert.recipient}</td>
            <td>${new Date(cert.issue_date).toLocaleDateString()}</td>
            <td>
                <span class="status-badge status-valid">Valid</span>
                <span class="badge bg-info ms-2">
                    <i class="fas fa-download"></i> ${cert.download_count || 0}
                </span>
            </td>
        </tr>
    `).join('');
};

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('certificateForm').addEventListener('submit', handleCertificateSubmit);
    document.getElementById('verifyForm').addEventListener('submit', handleVerificationSubmit);
    updateRecentCertificates();
});