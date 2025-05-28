import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

dotenv.config({ path: './src/backend/.env' });

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if OTP already exists for this email and is still valid
    const { data: existingOtpData, error: selectError } = await supabase
      .from('login_otp_codes')
      .select('*')
      .eq('email', email)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows found, so ignore that error
      console.error('Supabase select error:', selectError.message);
      return res.status(500).json({ error: 'Database error' });
    }

    const now = new Date();

    if (existingOtpData && new Date(existingOtpData.expires_at) > now) {
      // OTP still valid, don't resend
      return res.status(429).json({ error: 'OTP already sent. Please check your email.' });
    }

    // Generate new OTP and expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    // Upsert the OTP record, must use array for upsert
    const { error: upsertError } = await supabase
      .from('login_otp_codes')
      .upsert(
        [{
          email,
          otp,
          expires_at: expiresAt.toISOString(),
        }],
        { onConflict: 'email' }
      );

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError.message);
      return res.status(500).json({ error: 'Failed to store OTP' });
    }

    // Send OTP email
    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login OTP',
      text: `Your OTP is: ${otp}`,
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error in /send-otp:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});