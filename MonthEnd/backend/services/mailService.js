const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

async function sendParentEmail(to, html) {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Monthly Financial Report",
    html,
  });
}

module.exports = { sendParentEmail };