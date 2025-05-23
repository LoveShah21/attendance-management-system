const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  // Replace with your email service credentials
  const transporter = nodemailer.createTransport({
    service: "gmail", // or use "SMTP" options
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail or SMTP user
      pass: process.env.EMAIL_PASS, // Your app-specific password or SMTP password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
