
'use server';

// In a real application, you would install and import the SendGrid mail service
// import sgMail from '@sendgrid/mail';

interface PaymentRequestEmail {
    to: string;
    requesterName: string;
    amount: number;
    currency: string;
    description: string;
    paymentLink: string;
}

// This is a placeholder function. In a real application, you would use the
// SendGrid SDK to send the email.
export async function sendPaymentRequestEmail(details: PaymentRequestEmail) {
    
    // 1. Set the API key from environment variables
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

    // 2. Construct the email message
    const msg = {
        to: details.to,
        from: 'noreply@payvost.com', // Use a verified sender email
        subject: `Payment Request from ${details.requesterName}`,
        // You can use a pre-made SendGrid template and pass dynamic data,
        // or construct the HTML directly here.
        html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
                <h2>You've Received a Payment Request</h2>
                <p>Hello,</p>
                <p>${details.requesterName} is requesting a payment of <strong>${details.amount} ${details.currency}</strong> for: "${details.description}".</p>
                <p>
                    <a href="${details.paymentLink}" style="background-color: #3CB371; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Pay Securely Now
                    </a>
                </p>
                <p style="font-size: 12px; color: #888;">If you were not expecting this, please ignore this email.</p>
            </div>
        `,
    };

    // 3. Send the email (currently commented out)
    /*
    try {
        await sgMail.send(msg);
        console.log('Payment request email sent successfully to', details.to);
        return { success: true };
    } catch (error) {
        console.error('Error sending email with SendGrid:', error);
        // If the error object has more details, you might want to log them
        if (error.response) {
            console.error(error.response.body)
        }
        throw new Error('Failed to send payment request email.');
    }
    */
   
    // For now, just simulate a success and log the action
    console.log('--- EMAIL SIMULATION ---');
    console.log(`An email would be sent to: ${msg.to}`);
    console.log(`Subject: ${msg.subject}`);
    console.log('--------------------------');
    
    return { success: true };
}
