# Julia Pendlenton Store

Starter e-commerce project built with Node.js, Express, EJS, MongoDB, and Mongoose.

## Requirements
- Node.js (LTS recommended)
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup
1. Extract this folder.
2. Open the folder in VS Code.
3. In the terminal, run:
   ```bash
   npm install
   ```
4. Copy `.env.example` to a new file named `.env`.
5. Set `MONGODB_URI` and a long random `SESSION_SECRET` in `.env`.
6. Start MongoDB locally if using the local URI.
7. Run:
   ```bash
   npm run dev
   ```
8. Open `http://localhost:3000`.

The first run seeds sample products automatically if the products collection is empty.

## Create an admin user
Do not leave a publicly known admin password in production. After starting MongoDB, create an admin user once from the project folder:

```bash
node -e "require('dotenv').config(); const mongoose=require('mongoose'); const bcrypt=require('bcryptjs'); const User=require('./models/User'); mongoose.connect(process.env.MONGODB_URI).then(async()=>{const email=process.env.ADMIN_EMAIL;const password=process.env.ADMIN_PASSWORD;if(!email||!password){throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first')}const exists=await User.findOne({email});if(exists){console.log('User already exists; role was not changed.');}else{await User.create({name:'Store Admin',email,passwordHash:await bcrypt.hash(password,12),role:'admin'});console.log('Admin created. Change the password after first use.')}await mongoose.disconnect()}).catch(e=>{console.error(e);process.exit(1)})"
```

Then sign in at `/auth/login` using those credentials and open `/admin`.

## Included
- Home page and product catalog with search/category filter
- Product detail pages
- Session-based cart
- Guest checkout with cash on delivery
- Order tracking using order number + phone
- Customer registration/login and order history
- Admin dashboard, product management, order status updates, stock alerts
- Sample SVG product artwork
- Responsive layout

## Important before production
This is a functional starter, not a fully audited production store. Add CSRF protection, rate limiting, stronger validation, secure production cookie settings, email/SMS notifications, payment-provider integration, shipping-provider integration, image uploads, privacy/return policies, and proper transaction handling. Test cancellation and stock restoration rules before live use. Serve over HTTPS and use a strong `SESSION_SECRET`.
