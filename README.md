# Al-Mawarith (Islamic Inheritance Calculator)

Al-Mawarith is a full-stack web application designed to calculate Islamic inheritance (Mirath) distributions according to Sharia law with precision and ease.

This tool simplifies the complex rules of Fard (fixed shares) and Ta'sib (residuary shares), allowing users to input a deceased person's profile, surviving heirs, and assets to generate an exact distribution report.

## Features

*   **Heir Management**: dynamic input for surviving relatives (spouses, children, parents, siblings, etc.).
*   **Asset Valuation**: Supports multiple asset types including liquid cash, real estate, and commodities (e.g., oil, gold).
*   **Sharia-Compliant Calculation**:
    *   Calculates fixed fractional shares (*Fard*).
    *   Distributes remaining estate to residuary heirs (*Ta'sib*).
    *   Handles cases of exclusion (*Hajb*) and recalculations (*Awl* or *Radd*).
*   **Visual Results**: Clear breakdowns of shares and total asset values for each heir.

## Tech Stack

### Backend
*   **Framework**: Django (Python)
*   **API**: Django REST Framework (DRF)
*   **Database**: SQLite (default for dev) / PostgreSQL (production ready)

### Frontend
*   **Framework**: React 19
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM
*   **Visualization**: Recharts
*   **HTTP Client**: Axios

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
*   Python 3.8+
*   Node.js 18+ and npm

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment (optional but recommended):
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run migrations:
```bash
python manage.py migrate
```

Start the server:
```bash
python manage.py runserver
```
The backend API will run at `http://127.0.0.1:8000/`.

### 2. Client Setup

Open a new terminal and navigate to the client directory:
```bash
cd client
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The frontend will run at `http://localhost:5173/` (or the port shown in your terminal).

## Usage

1.  Open the application in your browser.
2.  Navigate to the Calculator page.
3.  Enter the details of the deceased and select the surviving heirs.
4.  Input the value of assets (Cash, Property, etc.).
5.  View the detailed distribution results.

## License

[MIT](LICENSE)
