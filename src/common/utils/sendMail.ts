import nodemailer, {Transporter} from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import { config } from '../../config/app.config';

interface EmailOptions{
    email: string;
    subject: string;
    template: string;
    data: {[key: string]: any};
}

const sendMail = async (options: EmailOptions): Promise <void> => {

    const transporter: Transporter = nodemailer.createTransport({
        host: config.Email.MAIL_HOST,
        port: parseInt(config.Email.MAIL_PORT || '587'),
        service: config.Email.MAIL_SERVICE,
        auth:{
            user: config.Email.MAIL_MAIL,
            pass: config.Email.MAIL_PASSWORD,
        }
    });

    const {email, subject, template, data} = options;

    // get the pdath to the email template file
    const templatePath = path.join(__dirname, '../../mailers/templates/', template);

    // Render the email template with EJS
    const html: string = await ejs.renderFile(templatePath, data)

    // const mailer_sender = config.NODE_ENV === "development"? "dev@example.com" : config.Email.MAIL_MAIL;

    const mailOptions = {
        from: config.Email.MAIL_MAIL ,
        to: email,
        subject,
        html
    }

    await transporter.sendMail(mailOptions)
}

export default sendMail;