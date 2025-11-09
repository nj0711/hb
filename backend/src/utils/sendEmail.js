import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
  try {
    // Looking to send emails in production? Check out our Email API/SMTP product!
    var transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "3c9e97f7417e55",
        pass: "c0edb7a5568959",
      },
    });

    const mailOptions = {
      from: `"PG Booking" <test@mailtrap.io>`, //  change domain!
      to,
      subject,
      html,
    };

    const info = await transport.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};
