# Gmail SMTP Setup Guide

## Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Sign in with `mail.taskgrid@gmail.com`
3. Click on **"2-Step Verification"**
4. Follow the prompts to enable 2FA (you'll need your phone)

## Step 2: Generate App Password

1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. In "Select app" dropdown, choose **"Mail"**
4. In "Select device" dropdown, choose **"Other (Custom name)"**
5. Type: **"TaskGrid Application"**
6. Click **"Generate"**
7. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)
8. **Important**: Remove all spaces, so it becomes: `abcdefghijklmnop`

## Step 3: Update .env File

Open your `.env` file and update the SMTP settings:

```env
# Email Configuration - Gmail SMTP
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="mail.taskgrid@gmail.com"
SMTP_PASSWORD="abcdefghijklmnop"  # Your 16-char app password (no spaces)
SMTP_FROM="TaskGrid <mail.taskgrid@gmail.com>"
```

## Step 4: Test

After updating `.env`, run:
```bash
node scripts/test-email-to-akhil.js
```

This should successfully send an email to akhil28tayal@gmail.com!

## Why This Works

- Gmail App Passwords bypass the normal password authentication
- They work even with 2FA enabled
- You can send to ANY email address (not just verified ones)
- No domain verification needed
- Free and reliable

## Troubleshooting

If you get "Invalid login" error:
- Make sure 2FA is enabled first
- Make sure you removed all spaces from the app password
- Make sure you're using the app password, not your regular Gmail password
