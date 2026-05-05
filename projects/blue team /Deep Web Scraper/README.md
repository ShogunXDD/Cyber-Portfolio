# Deep Web Scraper

Deep Web Scraper is an advanced, local-first Open Source Intelligence (OSINT) application engineered specifically for accessing and analyzing data from the Dark Web. Built for cybersecurity researchers, threat intelligence analysts, and privacy advocates, it seamlessly bridges the gap between secure Tor network scraping and cutting-edge Large Language Models (LLMs).

By routing searches entirely through the local system's Tor proxy, Deep Web Scraper guarantees absolute operational security while preventing the leakage of search intents. It features a stunning, cyber-themed React dashboard for issuing trace commands, alongside a highly secure Admin Panel for user and audit log management.

### ✨ Key Features
- **Tor Network Integration**: Scrape `.onion` domains securely via local SOCKS5 proxy routing.
- **LLM-Powered Analysis**: Connects with OpenAI, Anthropic, Gemini, Groq, and Ollama to automatically ingest, summarize, and extract actionable intelligence from unstructured dark web HTML.
- **Local-First Architecture**: 100% of your data stays on your machine. No cloud databases, no telemetry, and zero third-party tracking.
- **Secure Admin Panel**: Built-in SQLite database with hashed credentials, allowing administrators to audit historical search logs and purge user data.
- **Cyberpunk UI/UX**: An immersive, highly-responsive terminal aesthetic built with React and Vite.

### 🛠️ Built With
* **Frontend**: React (v18.2.0), Vite (v5.0.0), Lucide Icons (v0.294.0)
* **Backend**: FastAPI (v0.136.1), Uvicorn (v0.46.0)
* **AI & Logic**: LangChain (v1.3.2), OpenAI SDK (v2.33.0)
* **Scraping**: BeautifulSoup4 (v4.14.3), Requests (v2.33.1), PySocks (v1.7.1)
* **Database**: SQLite (Native Python 3)

---

## 📸 Application Gallery

Here is a glimpse of the Scraper UI in action:

<p align="center">
  <img src="screenshots/screenshot_3.png" width="48%" alt="Admin Panel" />
  <img src="screenshots/screenshot_7.png" width="48%" alt="Intelligence Dashboard" />
</p>
<p align="center">
  <img src="screenshots/screenshot_2.png" width="48%" alt="Login Gateway" />
  <img src="screenshots/screenshot_5.png" width="48%" alt="Settings Panel" />
</p>

---

## 🚀 Quick Start Guide

### 1. Prerequisites
> [!IMPORTANT]
> Before running the application, make sure you have the following installed on your machine:
> * **Python 3.8+**
> * **Tor Service**: Required to access `.onion` links. 
>   * *Windows*: Download the Tor Expert Bundle or keep the Tor Browser running in the background.
>   * *macOS*: `brew install tor` and run `brew services start tor`
>   * *Linux*: `sudo apt install tor` and run `sudo systemctl start tor`

### 2. Environment Configuration
The application relies on API keys to communicate with your preferred AI models.

> [!NOTE]
> 1. Locate the `.env.example` file in the root directory.
> 2. Rename the file to `.env` (or create a copy named `.env`).
> 3. Open the `.env` file and add your API keys. 
> 
> *You do not need all of them. The application will dynamically enable only the models for which you have provided an API key.*

### 3. Installation
> [!TIP]
> To install the required dependencies, run the following command in your terminal:
> ```bash
> pip install -r requirements.txt
> ```

### 4. Running the Application
> [!TIP]
> For Windows users, simply double-click the included batch file:
> ```bash
> start_scraper.bat
> ```
> This will automatically launch the backend server on port `8501` and open the application in your default web browser.

Alternatively, you can run it manually via terminal:
```bash
python -m uvicorn api:app --host 0.0.0.0 --port 8501
```

---

## 🔐 Default Credentials

Upon first launch, the database (`storage.db`) is automatically created with a default administrator account.

* **Admin Username**: `admin`
* **Admin Password**: `123`

> **Note:** It is highly recommended that you change this password if you plan to expose this application to any external network. To change it, delete `storage.db`, add `ADMIN_PASSWORD=your_new_password` to your `.env` file, and restart the application.

---

## 🛠️ Usage & Features

* **Login/Registration**: Users can create basic accounts to save their search queries and histories. The admin account provides oversight over all instances.
* **LLM Selection**: From the main dashboard, use the dropdown menu to select your desired AI model. Only models configured in your `.env` file will be available.
* **Dark Web Scraping**: Enter search queries. The application will route the request through Tor, scrape dark web links, and feed the data to your selected LLM to generate an intelligence report.
* **Admin Panel**: Log in as `admin` to access the Admin Panel. From here, you can oversee all users, review global search histories, scrub data, and view user feedback.

---

## 📄 License

This project is open-source and licensed under the [GNU General Public License v3.0 (GPLv3)](LICENSE). You are free to use, modify, and distribute this software, provided that any modifications or derivative works are also distributed under the same open-source GPLv3 license.
