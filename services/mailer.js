const mailgun = require("mailgun-js");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

// Check if MAILGUN_API_KEY is defined in your environment variables or .env file
const apiKey = `${process.env.MAILGUN_API_KEY}`;

if (!apiKey) {
  console.error("Mailgun API key is not defined!");
  process.exit(1);
}

// Initialize Mailgun with your API key and domain
const domain = `${process.env.MAILGUN_DOMAIN}`;
const mg = mailgun({ apiKey, domain });


const sendSGMail = async ({
    f,
    to,
    subject,
    text,

}) => {
    try {
        const from = f || "mohibullamiazi@gmail.com";

        const msg = {
            from: from,
            to: to,
            subject: subject,
            text: text,
          };
        return mg.messages().send(msg)
    } catch (error) {
        console.log(error);
    }
}

exports.sendEmail = async (args) => {
    if (process.env.NODE_ENV === "development") {
        return new Promise.resolve();
    } else {
        return sendSGMail(args);
    }
}