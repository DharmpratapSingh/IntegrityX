# IntegrityX - Financial Document Integrity System

A comprehensive financial document integrity and verification system built with Python and Next.js.

## 🏗️ Project Structure

```
IntegrityX_Python/
├── app.py                     # Main Streamlit application
├── backend/                  # Backend API and services
│   ├── main.py              # FastAPI application
│   ├── src/                 # Core backend modules
│   └── ...
├── frontend/                 # Next.js frontend application
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   └── ...
├── database/                # Database files
│   └── integrityx.db        # SQLite database
├── tests/                   # Test files and data
│   ├── data/                # Test data files
│   ├── html/                # HTML test files
│   ├── samples/             # Sample documents
│   └── docs/                # Test documentation
├── docs/                    # Project documentation
├── config/                  # Configuration files
├── scripts/                 # Utility scripts
├── logs/                    # Application logs
└── venv/                    # Python virtual environment
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- SQLite

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Main Application
```bash
python app.py
```

## 📋 Features

- **Document Integrity Verification**: Tamper detection and verification
- **Provenance Tracking**: Complete document history and chain of custody
- **Multi-format Support**: PDF, Word, Excel, and more
- **Quantum-Safe Encryption**: Advanced cryptographic protection
- **Real-time Monitoring**: Live integrity status and alerts
- **Admin Dashboard**: Comprehensive management interface

## 🔧 Configuration

- Database: SQLite (configurable)
- Authentication: Clerk integration
- Encryption: AES-256 with quantum-safe algorithms
- Logging: Comprehensive audit trails

## 📚 Documentation

See the `docs/` directory for detailed documentation:
- Implementation guides
- API documentation
- Test plans
- Security specifications

## 🧪 Testing

Run tests from the `tests/` directory:
```bash
cd tests
python -m pytest
```

## 📄 License

This project is part of the Walacor Financial Integrity Challenge.
