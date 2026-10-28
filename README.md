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
   - Administrators can update course prices, apply percentage discounts (e.g., 20%, 35%, 50%), and toggle promotional deals directly in the Admin Console.
   - No website code modification or redeployment required.

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

---

## 📂 Project Structure

```text
├── app/
│   ├── (auth)/             # Login, signup, password reset & callback flows
│   ├── admin/              # Secure faculty & mentor command center
│   ├── api/                # API routes (admin auth, course pricing, weekly assessments, grading)
│   ├── courses/            # Course discovery & curriculum timeline breakdown
│   ├── dashboard/          # Student dashboard, weekly assignments & instant marks
│   ├── profile/            # Student private dossier & enrolled programs
│   ├── globals.css         # Responsive theme styling & CSS variables
│   └── layout.tsx          # Root layout & global viewport metadata
├── components/
│   ├── admin-panel.tsx     # Admin console: pricing, assessments, real students & audit logs
│   ├── course-card.tsx     # Responsive cards with dynamic price & discount badges
│   ├── header.tsx          # Unified public / student navigation
│   └── footer.tsx          # Footer with mission statement & platform links
├── lib/
│   ├── assessments.ts      # Real student directory, weekly assignments & instant grading
│   ├── courses.ts          # Course definitions, 3/4-month metadata & dynamic pricing store
│   ├── crypto.ts           # AES-256-GCM cipher, timingSafeCompare & session token signers
│   ├── lms.ts              # 12-week & 16-week comprehensive course syllabi
│   └── supabase/           # SSR cookie-aware Supabase clients & proxy
└── supabase/
    └── schema.sql          # Complete PostgreSQL schema, tables, RLS policies & triggers
```

---

## 🗄️ Supabase Free Tier Database Setup

Follow these steps to initialize your database:

1. Sign up for a free account at [supabase.com](https://supabase.com) and create a new project.
2. In your Supabase Project Dashboard, go to **SQL Editor** -> **New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](file:///home/rob0t/scratch/orbitlms/supabase/schema.sql) and paste them into the editor.
4. Click **Run**. This will create:
   - Tables: `courses`, `course_pricing`, `profiles`, `enrollments`, `weekly_assessments`, `assessment_submissions`.
   - Complete Row Level Security (RLS) policies protecting student records.
   - Auto-provisioning trigger `on_auth_user_created` for new signups.
   - Starter industry courses and weekly assignments.
   - Secure RPC function `get_admin_student_directory()`.
5. Go to **Authentication** -> **URL Configuration**:
   - **Site URL**: Set to your domain (e.g., `https://yourdomain.com` or `http://localhost:3000`).
   - **Redirect URLs**: Add `https://yourdomain.com/auth/callback` and `http://localhost:3000/auth/callback`.
6. Go to **Project Settings** -> **API** to copy:
   - **Project URL**
   - **anon / public key**
   - **service_role key** (keep secret; used only on the server)

---

## 🚀 Complete Step-by-Step Hostinger Deployment Guide

Hostinger VPS (Virtual Private Server) running **Ubuntu 22.04 or 24.04 LTS** is the recommended hosting environment for production Next.js 16 SSR applications with PM2 and Nginx.

### Step 1: Connect to your Hostinger VPS via SSH

Open your local terminal and log in using your VPS IP and root credentials:

```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

---

### Step 2: System Update & Install Dependencies

Update package lists and install essential build tools, Git, Nginx, and Certbot:

```bash
apt update && apt upgrade -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx
```

Install **Node.js 20.x LTS** via NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

Verify Node.js and npm versions:

```bash
node -v   # Output should be v20.x.x
npm -v    # Output should be 10.x.x
```

Install **PM2** process manager globally:

```bash
npm install -g pm2
```

---

### Step 3: Clone the Sams Edutech Repository

Create a directory for web applications and clone the repository:

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/hackk413/sams-edutech.git
cd sams-edutech
```

---

### Step 4: Configure Production Environment Variables

Create the `.env.local` file:

```bash
nano .env.local
```

Paste your production keys into `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Admin Master Passkey (for Admin Console login)
ADMIN_MASTER_KEY=YourSuperSecureAdminPasskey2026!

# Cryptographic Salt / Secret for AES-256-GCM & Session Tokens (min 32 chars)
ENCRYPTION_SECRET=e7b48991d087b2f4c9a8e0f11928374650192837465019283746501928374650

# Node Environment
NODE_ENV=production
PORT=3000
```

Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit.

---

### Step 5: Install Dependencies & Build the Application

```bash
npm install
npm run build
```

The build will compile optimized production assets into `.next`.

---

### Step 6: Start Application with PM2

Start the Next.js production server with PM2:

```bash
pm2 start npm --name "sams-edutech" -- start
```

Ensure PM2 automatically restarts upon server reboots:

```bash
pm2 startup
# (Run the sudo env PATH=... command printed by PM2)
pm2 save
```

Verify the process is running:

```bash
pm2 status
```

---

### Step 7: Configure Nginx as Reverse Proxy

Create an Nginx server block configuration:

```bash
nano /etc/nginx/sites-available/sams-edutech
```

Paste the following configuration (replace `yourdomain.com` with your actual domain name):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Next.js node application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Static file caching
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

---

### Step 8: Configure Free SSL Certificate with Let's Encrypt (Certbot)

Make sure your domain's A-record points to your Hostinger VPS IP address, then run:

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will configure SSL and automatic renewal.

---

### Step 9: Configure Firewall (UFW)

Enable firewall rules to secure your VPS:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

Your Sams Edutech application is now live at `https://yourdomain.com`!

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

# Run unit tests
npm test

# Run TypeScript typecheck
npm run typecheck

# Run Next.js production build
npm run build
```

---

## 📄 License

Proprietary — All rights reserved by **Sams Edutech**. Built for world-class technical education.
