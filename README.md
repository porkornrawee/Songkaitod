# 🍗 Songkaitod (ส่งไก่ทอด)

> A multi-role, QR-based food ordering & delivery platform built on the MERN stack.

[![Live Demo](https://img.shields.io/badge/Live_Demo-songkaitod.vercel.app-success?logo=vercel&logoColor=white)](https://songkaitod.vercel.app)
![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-43853D?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-4EA94B?logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?logo=socket.io&logoColor=white)

**Songkaitod** is a full-stack food ordering web app where diners scan a **QR code** to browse a
restaurant menu, build a cart, and place an order — while staff track and fulfil it in real time.
It models a complete ordering ecosystem with four roles (**Customer, Restaurant Owner,
Delivery Partner, Admin**) and ships production-style features such as live order updates over
WebSockets, AI chat support, biometric login, and a PWA install experience.

> 🎓 Team project at **Thammasat University** by [**Porkornrawee**](https://github.com/porkornrawee)
> & **Nathrada Buasuwan**. The codebase is adapted from the open-source
> [SwadKart-pro](https://github.com/theunstopabble/SwadKart-pro) MERN template by Gautam Kumar — see [Credits](#-credits).

---

## ✨ Features

- **📲 QR-code ordering** — scan a table/menu QR to open the restaurant menu and order directly.
- **🛒 Cart & checkout** — Redux-managed cart, shipping, coupons, and payment flow (Razorpay).
- **⚡ Real-time orders** — order status streams live from *Preparing → Out for delivery* via Socket.io.
- **👥 Four roles** — Customer, Restaurant Owner, Delivery Partner, and Admin, each with its own dashboard.
- **🔐 Flexible auth** — email/password (JWT), Google sign-in (Firebase), and **biometric login** (WebAuthn/FaceID/fingerprint).
- **🤖 AI chat assistant** — in-app support powered by LLM APIs (Groq / Google Generative AI).
- **📊 Admin analytics** — revenue/order charts (Recharts) and a demand heatmap (Leaflet + leaflet.heat).
- **📱 PWA** — installable, offline-aware, with push-style order notifications.

## 🧱 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19 (Vite), Redux Toolkit, React Router 7, Tailwind CSS, Socket.io-client, Leaflet, Recharts, Firebase Auth, WebAuthn |
| **Backend** | Node.js, Express 5, MongoDB (Mongoose), Socket.io, JWT, Cloudinary, Nodemailer, Razorpay |
| **Security** | Helmet, express-rate-limit, express-mongo-sanitize, bcrypt, HTTP-only cookies |
| **Tooling** | Vite, ESLint, vite-plugin-pwa, Nodemon |

## 📁 Repository Layout

The application lives in [`SwadKart-pro/`](SwadKart-pro):

```
Songkaitod/
└── SwadKart-pro/
    ├── backend/    # Express API — routes, controllers, models, Socket.io server
    └── frontend/   # React (Vite) client — pages, components, redux, PWA
```

## 🚀 Getting Started

**Prerequisites:** Node.js 18+, a MongoDB connection string, and a Firebase project (for Google auth).

```bash
git clone https://github.com/porkornrawee/Songkaitod.git
cd Songkaitod/SwadKart-pro
```

**Backend**
```bash
cd backend
npm install
# create .env (see SwadKart-pro/README.md for the full variable list)
npm run dev          # starts the API + Socket.io server
```

**Frontend**
```bash
cd frontend
npm install
# create .env with VITE_API_URL + Firebase keys
npm run dev          # starts the Vite dev server (http://localhost:5173)
```

> A detailed `.env` reference (database, SMTP, Razorpay, WebAuthn) is documented in
> [`SwadKart-pro/README.md`](SwadKart-pro/README.md).

## 🙏 Credits

This project is built on top of the open-source MERN template
**[SwadKart-pro](https://github.com/theunstopabble/SwadKart-pro)** by
**Gautam Kumar** ([@theunstopabble](https://github.com/theunstopabble)). Songkaitod adapts and
extends that base into a QR-first ordering experience with Thai localization and our own
feature work. All credit for the original foundation goes to the upstream author.

**Songkaitod team**
- [Porkornrawee](https://github.com/porkornrawee)
- Nathrada Buasuwan

---

<div align="center"><i>🍗 ส่งไก่ทอด — สแกน สั่ง ส่ง ครบจบในที่เดียว</i></div>
