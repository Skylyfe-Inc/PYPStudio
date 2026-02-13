// Quick script to manually set vendor claim for existing user
const admin = require('firebase-admin');
const serviceAccount = require('./server/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Replace with your vendor's UID from Firebase Console
const vendorUid = 'b8ZpgwgHlXaop9Oo0lv06bUggN33';

async function setVendorClaim() {
  try {
    await admin.auth().setCustomUserClaims(vendorUid, { role: 'vendor' });
    console.log('✅ Vendor claim set successfully for uid:', vendorUid);
    console.log('The user needs to log out and log back in for claims to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting claim:', error);
    process.exit(1);
  }
}

setVendorClaim();
