🌞 Solar Dashboard (Next.js)

A modern Solar Energy Monitoring Dashboard built with Next.js, designed to visualize real-time solar telemetry, historical trends, and energy insights through interactive charts and analytics.

🚀 Features

✨ Real-time solar data monitoring
📊 Interactive charts (energy, power, trends)
📈 Historical data tracking
🔐 Authentication system (login/signup)
📧 Email alert system (SMTP / SendGrid)
📡 API endpoints for data ingestion
⚡ KPI cards & live dashboard controls
🎨 Responsive modern UI (Tailwind CSS)

🧰 Tech Stack

Frontend

Next.js 14

React

Tailwind CSS

Chart.js / Recharts

Backend

Next.js API Routes

Node.js

Database / Storage

SQLite (better-sqlite3)

Authentication

NextAuth.js

Other Tools

SWR (data fetching)

PapaParse (CSV handling)

Nodemailer / SendGrid (email alerts)

📂 Project Structure
solar-dashboard-next/
│
├── components/        # Reusable UI components
├── pages/             # Next.js pages & API routes
│   ├── api/           # Backend APIs
│   ├── dashboard.js   # Main dashboard page
│   ├── login.js
│   └── signup.js
│
├── lib/               # Database & utilities
├── data/              # Telemetry / latest data
├── realtime_publisher.py
├── serial_to_api.py   # Sensor → API pipeline
└── package.json

⚙️ Installation & Setup
1️⃣ Clone repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd solar-dashboard-next

2️⃣ Install dependencies
npm install

3️⃣ Environment Variables

Create:

.env.local


Add required values (example):

NEXTAUTH_SECRET=your_secret
SENDGRID_API_KEY=your_key
EMAIL_USER=example@mail.com
EMAIL_PASS=password

4️⃣ Run development server
npm run dev


Open:

http://localhost:3000

🖥️ Available Scripts
npm run dev     # Start development server
npm run build   # Create production build
npm run start   # Start production server

📡 API Endpoints (Example)
Endpoint	Description
/api/latest	Fetch latest sensor data
/api/history	Get historical data
/api/forecast	Forecast analytics
/api/ingest	Data ingestion API
/api/send-alert	Send alert email
🔥 Use Cases

Solar plant monitoring

Energy analytics dashboard

IoT data visualization

Smart energy management systems

📸 Future Improvements

⚡ WebSocket live streaming

🤖 AI-based energy prediction

📱 Mobile optimized dashboard

🌍 Multi-location monitoring

👨‍💻 Author

Mithul Narayana
