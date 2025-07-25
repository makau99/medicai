# 🏥 MediConnect AI – Hospital Appointment & Triage Web App

A responsive, student-built web application for booking hospital appointments, triaging symptoms, and locating nearby hospitals in Kenya. This system simplifies hospital access through an intuitive interface and integrated location intelligence.

---

## 🚀 Features

- 🔐 **User Authentication** via Supabase
- 🤖 **Symptom Checker (Triage)** powered by AI prompts
- 🗺️ **Hospital Locator** using Google Maps and GeoJSON data
- 📅 **Appointment Booking** with real-time Supabase integration
- 🌐 **Responsive UI** with a clean glassmorphism aesthetic
- 🔎 **Location-aware** recommendations based on proximity

---

## 📁 Project Structure

/
├── home.html
├── appointments.html
├── maps.html
├── triage.html
├── about.html
├── login.html
├── dashboard.html
├── assets/
│ ├── icon.png
│ ├── liquid-cheese.png
│ └── mygeodata/kenya_hospitals_per_county.geojson
├── styles/
│ ├── appointments.css
│ ├── maps.css
│ └── shared.css
└── README.md

## 💻 Technologies Used

| Stack | Description |
|-------|-------------|
| **HTML5** | Frontend markup |
| **CSS3** | Layout and styling (Glassmorphism) |
| **JavaScript (Vanilla)** | Dynamic behavior & Supabase integration |
| **Supabase** | Auth & Database for appointments |
| **Google Maps API** | Hospital locator with directions |
| **GeoJSON** | Hospital data by county |
| **Font** | [Google Fonts – Quicksand](https://fonts.google.com/specimen/Quicksand) |

---

## 👨‍💻 Developer Profile

**Evans Makau**  
🎓 *Student, Aspiring Software Developer & Data Scientist*  
💡 Passionate about using code to improve healthcare access and experience in Kenya.

---

## ⚙️ Setup & Deployment

### Prerequisites
- Internet connection (for Supabase and Google Maps API)
- Browser (latest Chrome, Firefox, etc.)
- Optional: VS Code or any code editor

### Running the Project

1. Clone this repository or download ZIP  
2. Open `home.html` in your browser  
3. Ensure the following resources are correctly linked:
   - Google Maps API Key in `maps.html`
   - Supabase credentials in `appointments.html`

---

## 📌 Notes

- 🗂️ You can find hospital location data in `mygeodata/kenya_hospitals_per_county.geojson`
- 🧠 Triage system uses basic prompt buttons simulating AI guidance
- 📍 Hospital branches are dynamically pulled into appointments
- 🔒 Auth is required to access `appointments.html` and `dashboard.html`

---

## 🔖 Tags

`#html` `#css` `#javascript` `#healthtech` `#supabase` `#google-maps` `#student-project` `#glassmorphism` `#kenya` `#geojson` `#triage` `#appointments` `#location-aware`

---

## 📜 License

This project was developed for educational purposes and is free to use, modify, and learn from.

---
