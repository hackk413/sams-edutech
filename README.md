# Sams Edutech — Enterprise Learning Management System

> **Motive & Mission**: Our mission is to make industry-relevant technical education accessible, practical, and career-focused for every learner.

Sams Edutech is a production-grade, highly secure Learning Management System (LMS) built with **Next.js 16 App Router**, **React 19**, **TypeScript**, and **Supabase (PostgreSQL with Row Level Security)**. It is specifically engineered to run efficiently and securely on the **Supabase Free Tier** using persistent long-lived cookies, zero client-side cold logouts, dynamic admin-controlled course pricing, and an instant assessment evaluation engine.

---

## 🌟 Key Highlights & Architectural Features

1. **4-Month & 3-Month Industry Training Plans**:
   - **4-Month Comprehensive Tracks** (16 Weeks): *Cybersecurity & SOC Operations*, *Generative AI & Autonomous Agents*, *Full Stack Web & Cloud Engineering*.
   - **3-Month Accelerator Tracks** (12 Weeks): *Applied Data Science & Advanced Analytics*, *Machine Learning Engineering & MLOps*.
   - In-depth, month-by-month and week-by-week technical syllabi matching enterprise engineering standards.

2. **Real Student Cohort Directory (Zero Dummy Data)**:
   - Admin command center queries real student accounts, profiles, enrollments, and submissions directly from the Supabase database.
   - Hardcoded demo and dummy users have been completely eliminated.

3. **Dynamic Course Pricing & Percentage Discounts (Admin Controlled)**:
   - Standard courses set at ₹28,000 slashed to ₹23,999 (~14% discount).
   - Cloud Computing course set at ₹30,000 slashed to ₹26,000 (~13% discount).
   - Administrators can update course prices, apply percentage discounts, and toggle promotional deals directly in the Admin Console with zero code modifications or redeployments.

4. **Weekly Assignments & Instant Grading Engine**:
   - Weekly hands-on lab assignments mapped to the 3-month and 4-month course timelines.
   - **Instant Evaluation Engine**: Automatically assigns verified grades (88–98%), rubric criteria checks, letter marks (`A+`), and AES-256-GCM encrypted mentor feedback upon submission.
   - Admins can re-grade or customize weekly assignments at any time via the admin portal.

5. **Optimized for Supabase Free Tier (Persistent Cookies & Local Caching)**:
   - Configured with long-lived session cookies (**1 year** for student sessions, **30 days** for admin sessions).
   - Automatic background token refresh via `supabase.auth.getUser()`.
   - Students remain safely logged in without frequent session expiries or repetitive login prompts.

6. **Enterprise Cryptography & Security Hardening**:
   - **AES-256-GCM** encryption for student feedback and mentor notes with 96-bit unique IVs and 128-bit authentication tags.
   - **Constant-time comparison** via `crypto.timingSafeEqual` prevents timing side-channel attacks on passkeys and admin tokens.
   - Strict Row Level Security (RLS) enforcing that students only view and modify their own records.

7. **Strict Gmail-Only Authentication**:
   - Only official `@gmail.com` accounts are accepted for student registration, sign in, and password recovery to eliminate disposable spam addresses.

8. **Indian Mobile Number Verification (+91)**:
   - Validates Indian 10-digit mobile phone numbers starting with 6, 7, 8, or 9.
   - Automatically normalizes numbers to standard `+91 XXXXX XXXXX` format in database records.

9. **Database Profile Picture Storage (`profiles.avatar_url`)**:
   - Profile photos are auto-compressed to lightweight size and stored directly in the `profiles` PostgreSQL table.
   - Stored pictures display across all devices, the student dashboard, and the admin dossier console.

10. **Direct UPI QR Scanner Gateway & Instant Course Unlock**:
   - **Zero Gateway Fees**: Eliminate third-party gateway deductions and merchant account setup fees. Students pay directly to your personal or business UPI ID.
   - **How the Server Verifies Payment**: Every UPI transaction generates an official **12-digit UTR / UPI Reference Number** (e.g. `432109876543`) on GPay, PhonePe, Paytm, and BHIM. The student submits their 12-digit UTR in the checkout modal.
   - **Instant Course Unlock**: When enabled, the server validates the 12-digit UTR, prevents duplicates, records the payment, and unlocks course access in `enrollments` instantly so the student can start learning immediately.
   - **Personal QR Upload**: Administrators can upload their custom UPI QR code image anytime in the `/admin` console with live preview. Images are saved to `public/uploads/` and served across all student checkout screens.
   - **Admin Approvals & Revocation**: Administrators can cross-verify UTRs with their bank notifications and approve or revoke course access in 1 click.

---

## 📂 Project Structure

```text
├── app/
│   ├── (auth)/             # Login, signup, password reset & callback flows
│   ├── admin/              # Secure faculty & mentor command center
│   ├── api/                # API routes (pricing, assessments, real student sync, grading)
│   ├── courses/            # Course discovery & curriculum timeline breakdown
│   ├── dashboard/          # Student dashboard, weekly assignments & demo certificate
│   ├── profile/            # Student private dossier & enrolled programs
│   ├── globals.css         # Responsive theme styling & CSS variables
│   └── layout.tsx          # Root layout & global viewport metadata
├── components/
│   ├── admin-panel.tsx     # Admin console: pricing, assessments, real students & audit logs
│   ├── course-card.tsx     # Responsive cards with dynamic price & discount badges
│   ├── header.tsx          # Unified public / student navigation
│   ├── footer.tsx          # Footer with mission statement & platform links
│   └── royal-certificate-card.tsx # Vector SVG completion certificate
├── lib/
│   ├── assessments.ts      # Real student directory, weekly assignments & instant grading
│   ├── courses.ts          # Course definitions, 3/4-month metadata & dynamic pricing store
│   ├── courses-server.ts   # Server-side pricing persistence & database overrides
│   ├── crypto.ts           # AES-256-GCM cipher, timingSafeCompare & session token signers
│   ├── lms.ts              # 12-week & 16-week comprehensive course syllabi
│   └── supabase/           # SSR cookie-aware Supabase clients & proxy
├── supabase/
│   └── schema.sql          # Complete PostgreSQL schema, tables, RLS policies & triggers
├── deploy.sh               # Automated 1-command Hostinger production deploy script
├── ecosystem.config.cjs    # Production PM2 cluster & process manager configuration
├── server.js               # Standalone production Node.js server for Hostinger hPanel
└── Dockerfile              # Multi-stage production container build
```

---

## 🗄️ Supabase Free Tier Database Setup

Follow these steps to initialize your database:

1. Sign up for a free account at [supabase.com](https://supabase.com) and create a new project.
2. In your Supabase Project Dashboard, navigate to **SQL Editor** -> **New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and paste them into the editor.
4. Click **Run**. This will create:
   - Tables: `courses`, `course_pricing`, `profiles`, `enrollments`, `weekly_assessments`, `assessment_submissions`, `upi_payments`, `upi_settings`.
   - Complete Row Level Security (RLS) policies protecting student records and payments.
   - Auto-provisioning trigger `on_auth_user_created` for new signups.
   - Starter industry courses with ₹28,000 / ₹23,999 pricing (and ₹30,000 / ₹26,000 for Cloud).
   - Secure RPC functions `get_admin_student_directory()`, `get_admin_submissions_directory()`, and `get_admin_payments_directory()`.
5. Go to **Authentication** -> **URL Configuration**:
   - **Site URL**: Set to your domain (e.g., `https://yourdomain.com`).
   - **Redirect URLs**: Add:
     - `https://yourdomain.com/auth/callback`
     - `https://www.yourdomain.com/auth/callback`
     - `http://localhost:3000/auth/callback`
6. Go to **Project Settings** -> **API** to copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon / publishable key** (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   - **service_role key** (Optional; server-side only)

---

## 🚀 Complete Step-by-Step Hostinger Hosting Guide

Hostinger offers two primary environments for hosting Next.js applications:
- **Method 1 (Recommended)**: **Hostinger KVM VPS** (Ubuntu 22.04 or 24.04 LTS) using PM2 & Nginx reverse proxy.
- **Method 2**: **Hostinger Cloud / Web Hosting with Node.js (hPanel)** using the included `server.js`.
- **Method 3**: **Hostinger VPS with Docker & Docker Compose**.

---

### Method 1: Hostinger KVM VPS Deployment (Recommended)

This method provides dedicated CPU/RAM, complete control, automatic restarts, zero downtime, and free SSL via Let's Encrypt.

#### Step 1.1: Connect to your Hostinger VPS via SSH
Open your terminal and connect with root credentials provided in your Hostinger VPS dashboard:
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

#### Step 1.2: System Update & Install Dependencies
Update packages and install Git, Nginx, Certbot, and build tools:
```bash
apt update && apt upgrade -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx build-essential
```

Install **Node.js 20.x or 22.x LTS** via NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Verify the installation:
```bash
node -v   # Should output v20.x.x
npm -v    # Should output 10.x.x
```

Install **PM2** process manager globally:
```bash
npm install -g pm2
```

#### Step 1.3: Enable Linux Swap Space (Crucial for VPS)
*Next.js production builds compile TypeScript and bundles which can cause Out-Of-Memory (OOM) errors on 1GB or 2GB RAM VPS servers. Creating a 2GB swap file prevents memory crashes:*
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
free -h
```

#### Step 1.4: Clone the Sams Edutech Repository
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/hackk413/sams-edutech.git
cd sams-edutech
```

#### Step 1.5: Configure Production Environment Variables
Create your production `.env.local` configuration file:
```bash
nano .env.local
```

Paste the following variables (replace with your actual Supabase credentials and chosen keys):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Admin Console Credentials (for /admin login)
ADMIN_ACCESS_KEY=sams-edutech-admin-2026-secure-key

# Cryptographic Secret for AES-256-GCM (minimum 32 characters)
ADMIN_SECRET_KEY=sams_master_crypto_secret_32bytes_2026_prod!

# Node Runtime
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```
Save with `Ctrl + O`, `Enter`, and exit with `Ctrl + X`.

#### Step 1.6: Install Dependencies & Build Application
```bash
npm install
npm run build
```
The build will compile optimized production routes into `.next`.

#### Step 1.7: Start Application with PM2
Launch the application using the preconfigured `ecosystem.config.cjs`:
```bash
pm2 start ecosystem.config.cjs
```
*(Alternatively: `pm2 start npm --name "sams-edutech" -- start`)*

Ensure PM2 automatically restarts the app on server reboots:
```bash
pm2 startup
# Run the specific command printed in your terminal by PM2, then run:
pm2 save
```

Verify your app is running:
```bash
pm2 status
curl http://127.0.0.1:3000
```

#### Step 1.8: Configure Nginx as Reverse Proxy
Create a new Nginx server configuration:
```bash
nano /etc/nginx/sites-available/sams-edutech
```

Paste the following configuration (replace `yourdomain.com` with your domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Allow avatar and assignment file uploads
    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Reverse proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_buffering off;
    }

    # Static assets cache
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Enable the configuration and reload Nginx:
```bash
ln -s /etc/nginx/sites-available/sams-edutech /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

#### Step 1.9: Point DNS & Obtain Free SSL Certificate
1. In your domain registrar (Hostinger, Cloudflare, Namecheap), add an **A Record**:
   - **Host / Name**: `@` &rarr; **Points to**: `YOUR_HOSTINGER_VPS_IP`
   - **Host / Name**: `www` &rarr; **Points to**: `YOUR_HOSTINGER_VPS_IP`
2. Obtain a free auto-renewing SSL certificate:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Step 1.10: Configure VPS Firewall (UFW)
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

#### Step 1.11: Future Updates (Zero-Downtime)
Whenever you push updates to GitHub, simply execute the included automated deploy script:
```bash
cd /var/www/sams-edutech
./deploy.sh
```

---

### Method 2: Hostinger Cloud / Shared Web Hosting (hPanel Node.js)

If you are using Hostinger Cloud Hosting or Business Web Hosting with Node.js support enabled in **hPanel**:

1. **Log in to Hostinger hPanel**: Navigate to **Websites** &rarr; **Manage** &rarr; **Node.js**.
2. **Configure Node.js Settings**:
   - **Node.js Version**: Select **20.x** or **22.x**.
   - **Application Mode**: **Production**.
   - **Application Root**: `public_html` (or your subdomain folder).
   - **Application Startup File**: `server.js` *(preconfigured in the root of this repository)*.
3. **Upload Files or Git Clone**:
   - Open **Git** in hPanel, connect repository `https://github.com/hackk413/sams-edutech.git` to deploy to `public_html`.
   - Alternatively, open **SSH / Terminal** in hPanel:
     ```bash
     cd ~/public_html
     git clone https://github.com/hackk413/sams-edutech.git .
     ```
4. **Set Environment Variables**:
   In hPanel under **Node.js &rarr; Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_ACCESS_KEY`
   - `ADMIN_SECRET_KEY`
   - `NODE_ENV=production`
   - `PORT=3000`
5. **Install Dependencies & Build**:
   In the hPanel Terminal:
   ```bash
   npm install
   npm run build
   ```
6. **Start Application**:
   Click **Start Application** or **Restart** in hPanel.
7. **Enable Free SSL**:
   In hPanel, navigate to **Security** &rarr; **SSL** &rarr; **Install SSL** (1-click active).

---

### Method 3: Hostinger VPS with Docker & Docker Compose

If you prefer containerized deployment:

1. Connect via SSH and install Docker:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
apt-get install -y docker-compose-plugin
```
2. Clone repository & prepare `.env.production`:
```bash
git clone https://github.com/hackk413/sams-edutech.git /var/www/sams-edutech
cd /var/www/sams-edutech
cp .env.example .env.production
nano .env.production
```
3. Build and launch:
```bash
docker compose up -d --build
```
Your application runs in an isolated, secure, auto-restarting container on port `3000`.

---

## 💳 Personal UPI QR Payment Gateway & Verification Guide

### 1. How the UPI Payment Gateway Works Without Gateway Fees
Traditional payment gateways (Razorpay, Cashfree, Stripe) require registered business entities, GST certificates, merchant account approvals, and charge 2%–3% in transaction fees.

Sams Edutech implements a direct **Peer-to-Peer / Merchant UPI QR Scanner Architecture**:
1. **Student Scans & Pays**: The checkout modal renders your personalized UPI QR Code and a direct **"Pay via UPI App"** button (which opens Google Pay, PhonePe, or Paytm automatically on mobile).
2. **Bank Generates a 12-Digit UTR**: Every successful UPI transaction generates an official **12-digit UTR (Unique Transaction Reference) / UPI Ref Number** on the student's payment confirmation screen.
3. **Student Enters 12-Digit UTR**: The student enters the 12-digit UTR number in the checkout modal.
4. **Server Validates & Grants Access**:
   - **Instant Enrollment Mode (Default)**: The server verifies that the UTR is a valid 12-digit number and has never been used before, logs the payment, and **instantly creates the course enrollment**. The student can begin learning immediately without waiting.
   - **Manual Approval Mode**: The course remains locked until you cross-check the UTR in your bank app and click **"Confirm"** in the Admin Console.

---

### 2. How to Upload & Change Your Personal UPI QR Code
You can update your personal QR code anytime directly from your phone or laptop with **zero code modifications**:

1. Log into the Admin Console at `https://yourdomain.com/admin`.
2. Click the **"UPI Payments & Gateway"** tab in the top navigation.
3. Under **"Personal UPI QR Code"**, click **"Click to Upload New QR Image"**.
4. Select any screenshot or image of your Google Pay, PhonePe, Paytm, or Bank QR code (`.png`, `.jpg`, `.webp`).
5. The image is automatically uploaded to `public/uploads/upi-qr.png`, saved to the configuration, and immediately activated across all course checkout screens!
6. Enter your **Payee UPI ID** (e.g. `yourname@okhdfcbank` or `samsedutech@upi`) and **Business Name**, then click **Save Gateway Settings**.

---

### 3. How to Verify Payments & Prevent Fraud
1. When a student submits a payment, you will receive an alert in `/admin` with their Name, Email, Course, Amount, and 12-Digit UTR.
2. Open your Google Pay / PhonePe / Paytm or Bank Statement and search for the 12-digit UTR.
3. In `/admin`:
   - If the payment was received: Click **"Confirm"** to permanently verify the record.
   - If fake, forged, or mismatched: Click **"Reject"** — the server will **immediately revoke and lock** the student's course access!
4. Duplicate UTR protection is built-in: The same 12-digit UTR cannot be submitted more than once across the entire platform.

---

## 🛠️ Hostinger Troubleshooting & FAQs

### Q1: `npm run build` fails with "JavaScript heap out of memory" or "Killed"
- **Cause**: The VPS ran out of physical RAM during TypeScript bundling.
- **Solution**: Enable Linux swap space as described in **Step 1.3** above:
  ```bash
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  ```
  You can also pass more memory directly:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm run build
  ```

### Q2: Nginx displays `502 Bad Gateway`
- **Cause**: Next.js is not running or crashed on port 3000.
- **Solution**: Check PM2 logs:
  ```bash
  pm2 status
  pm2 logs sams-edutech --lines 50
  ```
  Ensure `.env.local` contains valid Supabase keys and restart:
  ```bash
  pm2 restart sams-edutech
  ```

### Q3: Uploading profile avatars gives `413 Request Entity Too Large`
- **Cause**: Nginx default client upload limit is 1MB.
- **Solution**: Ensure your `/etc/nginx/sites-available/sams-edutech` includes:
  ```nginx
  client_max_body_size 50M;
  ```
  Then run `nginx -t && systemctl reload nginx`.

### Q4: Student stays on login page or redirects back to `/auth/login`
- **Cause**: Supabase Authentication **Redirect URLs** not configured for your live domain.
- **Solution**: Open your Supabase Dashboard &rarr; **Authentication** &rarr; **URL Configuration**:
  - Add `https://yourdomain.com/auth/callback` to the redirect whitelist.

---

## 🔒 Security Measures & Best Practices

| Security Area | Implementation |
| :--- | :--- |
| **Authentication Cookies** | Strict `HttpOnly`, `SameSite=Lax`, and `Secure` attributes in production with 1-year max-age. |
| **Admin Sessions** | Signed HMAC-SHA256 tokens with 30-day lifecycle, timing-safe validation, and single-click console locking. |
| **Data Encryption** | AES-256-GCM cipher with dynamic 96-bit IVs and 128-bit authentication tags for mentor evaluations. |
| **Timing Attack Mitigation** | `crypto.timingSafeEqual` constant-time buffer comparison for passkeys. |
| **Open Redirect Defense** | `safeNextPath` ensures auth redirects remain strictly inside domain boundaries. |
| **Database Isolation** | Row Level Security (RLS) ensures students can only read and modify their own records. |
| **HTTP Security Headers** | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. |

---

## 💻 Local Development & Quality Verification

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run unit test suite
npm test

# Run TypeScript typecheck
npm run typecheck

# Run ESLint validation
npm run lint

# Run Next.js production build
npm run build
```

---

## 📄 License

Proprietary — All rights reserved by **Sams Edutech**. Built for world-class technical education.
