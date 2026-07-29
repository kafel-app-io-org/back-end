import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const firebaseConfig = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
});

// ============================================
// PUT YOUR FCM TOKEN HERE
// ============================================
const FCM_TOKEN =
  'ezTdEHZ-SbCu3aniv0hXE7:APA91bFxPnizjqXenabEZHyTAxdk4ZEqtI2eO-HGbkxfrDvkuxn3glii3j5fK4k9JYfAW-oKUT8hb1bOzd5lEQYvnLV_3VmJSfFBWQ9DYVdXj1IJA-TvpRE';
// ============================================

async function testPushNotification() {
  console.log('🚀 Testing Firebase Push Notification...\n');

  const message: admin.messaging.Message = {
    token: FCM_TOKEN,
    notification: {
      title: 'Test Notification',
      body: 'This is a test push notification from Kafel backend!',
    },
    data: {
      notification_id: '999',
      transaction_id: '123',
      test: 'true',
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'kafel_notifications',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 0,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent successfully!');
    console.log('📧 Message ID:', response);
  } catch (error: any) {
    console.log('❌ Failed to send push notification');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);

    if (error.code === 'messaging/invalid-registration-token') {
      console.log('\n⚠️  The FCM token is invalid or malformed');
    } else if (error.code === 'messaging/registration-token-not-registered') {
      console.log('\n⚠️  The FCM token is not registered (app uninstalled or token expired)');
    }
  }

  process.exit(0);
}

testPushNotification();