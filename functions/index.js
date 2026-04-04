/**
 * Rakshak Firebase Cloud Functions
 *
 * SETUP:
 * 1. cd functions
 * 2. npm install
 * 3. Set environment variables:
 *    firebase functions:config:set email.user="your@email.com" email.pass="your-app-password"
 * 4. firebase deploy --only functions
 *
 * REQUIRES: Firebase Blaze (pay-as-you-go) plan
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ==========================================
// Email Transporter (Nodemailer)
// ==========================================
const getTransporter = () => {
  const emailConfig = functions.config().email || {};
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailConfig.user || process.env.EMAIL_USER,
      pass: emailConfig.pass || process.env.EMAIL_PASS,
    },
  });
};

// ==========================================
// 1. Push Notification on QR Scan
// ==========================================
exports.onNewScan = functions.database
  .ref('/scans/{customerId}/{scanId}')
  .onCreate(async (snapshot, context) => {
    const { customerId } = context.params;
    const scanData = snapshot.val();

    try {
      const customerSnap = await admin.database().ref(`customers/${customerId}`).once('value');
      const customer = customerSnap.val();

      if (!customer || !customer.fcmToken) return null;

      const typeEmoji = scanData.type === 'emergency' ? '🚨'
        : scanData.type === 'urgent' ? '⚠️' : '🅿️';

      const message = {
        token: customer.fcmToken,
        notification: {
          title: `${typeEmoji} Rakshak Alert — ${customer.vehicle}`,
          body: scanData.message || 'Someone scanned your Rakshak QR',
        },
        webpush: {
          notification: {
            icon: 'https://i.postimg.cc/yYyX0Mt7/Chat-GPT-Image-Feb-27-2026-11-52-07-PM.png',
            vibrate: [200, 100, 200, 100, 200],
            tag: 'rakshak-scan-' + context.params.scanId,
            renotify: true,
          },
          fcmOptions: { link: '/dashboard' },
        },
      };

      await admin.messaging().send(message);
      return null;
    } catch (error) {
      console.error('Push notification error:', error);
      return null;
    }
  });

// ==========================================
// 2. Send OTP for Admin Forgot Password
// ==========================================
exports.sendAdminOTP = functions.https.onCall(async (data, context) => {
  const { empId } = data;

  if (!empId) {
    throw new functions.https.HttpsError('invalid-argument', 'Employee ID is required');
  }

  try {
    // Find admin by empId
    const adminsSnap = await admin.database().ref('admins').once('value');
    if (!adminsSnap.exists()) {
      throw new functions.https.HttpsError('not-found', 'Admin system not configured');
    }

    const admins = adminsSnap.val();
    let adminKey = null;
    let adminData = null;

    for (const [key, adm] of Object.entries(admins)) {
      if (adm.empId?.toLowerCase() === empId.toLowerCase()) {
        adminKey = key;
        adminData = adm;
        break;
      }
    }

    if (!adminKey || !adminData) {
      throw new functions.https.HttpsError('not-found', 'Employee ID not found');
    }

    if (!adminData.email) {
      throw new functions.https.HttpsError('failed-precondition', 'No email registered for this admin');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP in Firebase
    await admin.database().ref(`adminOTP/${adminKey}`).set({
      otp,
      expiresAt,
      empId: adminData.empId,
      createdAt: new Date().toISOString(),
    });

    // Send email
    const transporter = getTransporter();
    const mailOptions = {
      from: `"Rakshak Admin" <${(functions.config().email || {}).user || 'noreply@rakshak.com'}>`,
      to: adminData.email,
      subject: '🔐 Rakshak Admin — Password Reset OTP',
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 500px; margin: 0 auto; background: #0a0a0a; color: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #F28C38;">
          <div style="background: linear-gradient(90deg, #F28C38, #ff6a00); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: #000; font-size: 22px; letter-spacing: 2px;">🛡️ RAKSHAK</h1>
            <p style="margin: 4px 0 0; color: #000; font-size: 11px; letter-spacing: 1px;">ADMIN PASSWORD RESET</p>
          </div>
          <div style="padding: 30px;">
            <p style="color: #ccc; font-size: 14px; margin-bottom: 20px;">
              Hi <strong style="color: #F28C38;">${adminData.name || 'Admin'}</strong>,
            </p>
            <p style="color: #aaa; font-size: 13px; line-height: 1.7; margin-bottom: 24px;">
              A password reset was requested for your admin account (${adminData.empId}). Use the OTP below to reset your password.
            </p>
            <div style="background: #111; border: 2px solid #F28C38; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="color: #888; font-size: 11px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px;">YOUR OTP CODE</p>
              <h2 style="color: #F28C38; font-size: 36px; font-weight: 900; letter-spacing: 10px; margin: 0;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 11px; text-align: center; margin-bottom: 16px;">
              This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
            </p>
            <hr style="border: none; border-top: 1px solid #222; margin: 20px 0;">
            <p style="color: #444; font-size: 10px; text-align: center;">
              If you didn't request this, please ignore this email or contact Super Admin immediately.
            </p>
          </div>
          <div style="background: #080808; padding: 16px; text-align: center;">
            <p style="color: #333; font-size: 9px; margin: 0;">&copy; 2026 Abhishek Technology India Private Limited</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Return masked email for UI
    const maskedEmail = adminData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    return {
      success: true,
      maskedEmail,
      adminKey,
      message: `OTP sent to ${maskedEmail}`,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Send OTP error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send OTP. Try again.');
  }
});

// ==========================================
// 3. Verify OTP & Reset Password
// ==========================================
exports.verifyAdminOTP = functions.https.onCall(async (data, context) => {
  const { adminKey, otp, newPasswordHash } = data;

  if (!adminKey || !otp || !newPasswordHash) {
    throw new functions.https.HttpsError('invalid-argument', 'All fields are required');
  }

  try {
    // Get stored OTP
    const otpSnap = await admin.database().ref(`adminOTP/${adminKey}`).once('value');

    if (!otpSnap.exists()) {
      throw new functions.https.HttpsError('not-found', 'No OTP found. Please request a new one.');
    }

    const otpData = otpSnap.val();

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      await admin.database().ref(`adminOTP/${adminKey}`).remove();
      throw new functions.https.HttpsError('deadline-exceeded', 'OTP expired. Please request a new one.');
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      throw new functions.https.HttpsError('permission-denied', 'Invalid OTP. Please try again.');
    }

    // Update password
    await admin.database().ref(`admins/${adminKey}/password`).set(newPasswordHash);

    // Delete used OTP
    await admin.database().ref(`adminOTP/${adminKey}`).remove();

    return {
      success: true,
      message: 'Password reset successfully!',
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    console.error('Verify OTP error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to reset password. Try again.');
  }
});
