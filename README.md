# 🏥 MedicAI – Hospital Appointment & Triage Web App  

A responsive, student-built web application that streamlines hospital access in Kenya.  
MedicAI allows users to **triage symptoms**, **book appointments**, and **locate nearby hospitals** through an intuitive interface enhanced with **location intelligence** and **AI-driven triage**.  

---

## 📸 UI Preview  

> *(Add screenshots/GIFs of your app here once available)*  

- 🏠 **Home Page** – Glassmorphism landing page with blurred navbar  
- 🔐 **Login/Signup** – Supabase authentication (secure access)  
- 📅 **Appointments Page** – Real-time hospital appointment booking  
- 🗺️ **Maps Page** – Google Maps with hospital GeoJSON overlay  
- 🤖 **Triage Page** – Infermedica-powered symptom checker  
- 📊 **Dashboard** – Personalized overview of appointments & health insights  

---

## 🚀 Features  

- 🔐 **User Authentication** with **Supabase** (signup, login, logout, session handling)  
- 📅 **Appointment Booking** – Store & fetch user appointments from Supabase  
- 🤖 **AI-powered Symptom Triage** – Powered by **Infermedica API v3**  
  - Autocomplete symptom search  
  - Evidence assessment workflow  
  - Emergency detection  
  - Diagnosis summary with progress indicators  
- 🗺️ **Hospital Locator** – Interactive **Google Maps** + **GeoJSON dataset**  
- 📍 **Location-aware Recommendations** – Hospitals suggested based on proximity  
- 🌐 **Responsive UI** – Glassmorphism, blurred navbar, and **Quicksand font**  
- 📊 **Dashboard View** – Cards, progress bars, and warm-tone theme  

---

## 📁 Project Structure  

```
/
├── home.html               # Landing page
├── login.html              # User login
├── signup.html             # User signup
├── dashboard.html          # User dashboard (auth required)
├── appointments.html       # Appointment booking (auth required)
├── maps.html               # Hospital locator with Google Maps
├── triage.html             # AI-powered symptom checker
├── about.html              # About/credits page
│
├── assets/
│   ├── icon.png            # App icon
│   ├── liquid-cheese.png   # Background pattern
│   └── mygeodata/kenya_hospitals_per_county.geojson
│
├── styles/
│   ├── shared.css          # Global theme (navbar, fonts, glassmorphism)
│   ├── home.css
│   ├── appointments.css
│   ├── maps.css
│   ├── triage.css
│   └── dashboard.css
│
└── README.md
```
2. Open `home.html` in your browser  

3. Configure credentials:  

   - **Supabase**:  
     Add your `SUPABASE_URL` and `SUPABASE_KEY` in:  
     - `appointments.html`  
     - `login.html`  
     - `signup.html`  
     - `dashboard.html`  

   - **Google Maps API**:  
     Insert API key inside `maps.html` `<script>` tag  

   - **Infermedica API**:  
     Update headers (`App-Id`, `App-Key`, `Interview-Id`) in `triage.html`  

4. Start using the app 🚀  

---

## 📌 Notes  

- 🗂️ Hospital location data lives at:  
  `assets/mygeodata/kenya_hospitals_per_county.geojson`  

- 🧠 Triage workflow:  
  1. Autocomplete symptoms  
  2. Add evidence  
  3. Emergency check  
  4. Get summary (diagnosis + next steps)  

- 🔒 Protected Pages:  
  - `appointments.html`  
  - `dashboard.html`  

- 📱 Fully **responsive design**: works on mobile & desktop  

---

## 🗺️ Roadmap  

- [x] Authentication with Supabase  
- [x] Appointment booking integration  
- [x] Google Maps hospital locator  
- [x] AI-powered triage workflow  
- [ ] Add doctor/admin panel  
- [ ] Enable SMS/email reminders for appointments  
- [ ] Deploy app on **Netlify / Vercel / GitHub Pages**  

---

## 🤝 Contribution  

Want to contribute?  

1. Fork the repository  
2. Create a feature branch (`feature-new-ui`)  
3. Commit changes (`git commit -m "Added new feature"`)  
4. Push branch (`git push origin feature-new-ui`)  
5. Open a Pull Request 🎉  

---

## 🔖 Tags  

`#html` `#css` `#javascript` `#supabase` `#infermedica` `#google-maps`  
`#geojson` `#healthtech` `#glassmorphism` `#student-project` `#kenya`  

---

## 📜 License  

This project is for **educational purposes**.  
You are free to **use, adapt, and improve** it for learning or community health projects.  
