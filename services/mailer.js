var nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });




const sendSGMail = async ({
  to,
  subject,
  text,
}) => {
    console.log(subject);
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.NODEMAILER_USER,
          pass: process.env.NODEMAILER_PASS,
        },
      });
      const mailOptions = {
        from: process.env.NODEMAILER_USER,
        to: to,
        subject: subject,
        text: text,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).send(error.toString());
        }
        res.status(200).send(info.response);
      });
};

exports.sendEmail = async (args) => {
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve();
  } else {
    try {
      return await sendSGMail(args);
    } catch (error) {
      // Handle the error, log it, or take appropriate action
      console.error("Error sending email:", error);
      return Promise.reject(error);
    }
  }
};
