// Simulating email and push notification services

const sendEmail = async (to, subject, html) => {
    // In a real app, use Nodemailer or SendGrid
    console.log(`[EMAIL SERVICE] Sending email to ${to}`);
    console.log(`[EMAIL SERVICE] Subject: ${subject}`);
    // console.log(`[EMAIL SERVICE] Body: ${html}`);
    return Promise.resolve(true);
};

const sendPushNotification = async (userId, title, body) => {
    // In a real app, use Expo Push API or Firebase Cloud Messaging
    console.log(`[PUSH SERVICE] Sending push to User ID ${userId}`);
    console.log(`[PUSH SERVICE] Title: ${title}`);
    console.log(`[PUSH SERVICE] Body: ${body}`);
    return Promise.resolve(true);
};

const notifyAdmin = async (title, message, data) => {
    // In a real app, you'd find all admin users and notify them
    // For now, we'll log it and assume there's a mechanism to fetch admins
    console.log(`[ADMIN NOTIFICATION] ${title}: ${message}`);
    console.log(`[ADMIN NOTIFICATION] Data:`, data);
    return Promise.resolve(true);
};

module.exports = {
    sendEmail,
    sendPushNotification,
    notifyAdmin
};
