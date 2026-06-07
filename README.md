# Pawffeur™ - Premium Pet Transportation

**Pawffeur™** is a premium pet transportation service providing concierge-level visibility, secure handlers, and real-time voyage confidence for pet owners.

This repository hosts the front-end web application and serverless APIs for the Pawffeur™ platform. It has been fully rebranded, security-hardened, and decoupled from the Base44 backend services to run as a self-contained local experience.

---

## ✨ Features

- **Premium Live Voyage Dashboard**: A simulated real-time tracking experience for pet owners (`TrackRide.jsx`) with dynamic route progress, passenger comfort checks, and concierge contact integrations.
- **Booking Flow**: Secure booking request process with integrated route pricing estimation.
- **Hardened Admin Auth**: Protected administrative portals utilizing environment-secured credentials.
- **Serverless API Support**: Fully-contained local and serverless endpoint handlers for booking requests and email alerts.

---

## 🛠️ Setup & Local Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd pawffeur
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory using the template in `.env.example`:
   ```bash
   copy .env.example .env
   ```
4. Define your `ADMIN_PASSWORD` and other API keys in the `.env` file.

### Running the App
Start the Vite development server:
```bash
npm run dev
```

---

## 🔒 Security & Decoupling

- **No Base44 Dependency**: This application is fully decoupled from the Base44 BaaS. The `@base44/sdk` library has been removed, and all client-side data services utilize the local stub client in [base44Client.js](file:///src/api/base44Client.js) to resolve states.
- **Environment Authentication**: Administrative endpoints strictly require and validate `ADMIN_PASSWORD` from system environment variables. Default fallbacks are disabled.

