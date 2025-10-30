# Contributing to IntegrityX

Thank you for your interest in contributing to IntegrityX! This document provides guidelines and instructions for contributing.

---

## 📋 **Table of Contents**

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Code Style](#code-style)
- [Documentation](#documentation)

---

## 📜 **Code of Conduct**

This project follows a Code of Conduct. By participating, you are expected to uphold this code. Please be respectful and professional in all interactions.

---

## 🚀 **Getting Started**

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/IntegrityX_Python.git
   cd IntegrityX_Python
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/IntegrityX_Python.git
   ```

4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 💻 **Development Setup**

### **Prerequisites**
- Python 3.12+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### **Backend Setup**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r config/requirements.txt

# Setup environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Run migrations
cd backend
python -m src.database
```

### **Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration
```

### **Docker Setup** (Alternative)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 🔨 **Making Changes**

### **Branch Naming Convention**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Maintenance tasks

Examples:
- `feature/add-blockchain-verification`
- `fix/database-connection-leak`
- `docs/update-api-guide`

### **Commit Message Convention**
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

**Examples**:
```
feat(api): add batch document verification endpoint

fix(auth): resolve token expiration issue

docs(readme): update installation instructions

refactor(database): optimize query performance
```

---

## 🧪 **Testing**

### **Backend Tests**
```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_provenance.py

# Run with coverage
pytest --cov=backend tests/
```

### **Frontend Tests**
```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### **Test Requirements**
- All new features must include tests
- Bug fixes should include regression tests
- Maintain or improve test coverage (95%+ backend, 90%+ frontend)
- All tests must pass before submitting PR

---

## 📤 **Submitting Changes**

### **Before Submitting**
1. **Update documentation** if needed
2. **Run tests** and ensure they pass
3. **Run linters**:
   ```bash
   # Backend
   pylint backend/main.py
   black backend/ --check
   
   # Frontend
   npm run lint
   ```
4. **Update CHANGELOG.md** (if applicable)
5. **Rebase on latest main**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

### **Creating Pull Request**
1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub

3. **Fill out the PR template** completely

4. **Link related issues** (if applicable)

5. **Wait for review** - Be responsive to feedback

### **PR Review Process**
- At least one maintainer must approve
- All CI checks must pass
- No merge conflicts
- Documentation updated
- Tests passing

---

## 🎨 **Code Style**

### **Python (Backend)**
- Follow [PEP 8](https://pep8.org/)
- Use [Black](https://black.readthedocs.io/) for formatting (line length: 120)
- Use [isort](https://pycqa.github.io/isort/) for import sorting
- Type hints encouraged
- Docstrings for public functions (Google style)

**Example**:
```python
def seal_document(
    document_hash: str,
    metadata: Dict[str, Any],
    encryption_key: str
) -> Dict[str, Any]:
    """
    Seal a document using blockchain technology.
    
    Args:
        document_hash: SHA-256 hash of the document
        metadata: Document metadata dictionary
        encryption_key: AES-256 encryption key
        
    Returns:
        Dictionary containing transaction ID and seal proof
        
    Raises:
        BlockchainError: If blockchain sealing fails
    """
    # Implementation here
    pass
```

### **TypeScript (Frontend)**
- Follow [TypeScript guidelines](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- Use [Prettier](https://prettier.io/) for formatting
- Use [ESLint](https://eslint.org/) for linting
- Functional components with hooks
- Proper TypeScript types (avoid `any`)

**Example**:
```typescript
interface DocumentUploadProps {
  onSuccess: (documentId: string) => void;
  onError: (error: Error) => void;
  maxFileSize?: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onSuccess,
  onError,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
  // Implementation here
};
```

---

## 📚 **Documentation**

### **Code Documentation**
- Document all public APIs
- Include examples for complex functionality
- Keep comments up-to-date with code changes
- Use clear, concise language

### **Guide Documentation**
- Update guides when features change
- Add new guides for new features
- Keep `DOCUMENTATION_INDEX.md` updated
- Include code examples and screenshots

### **API Documentation**
- Update OpenAPI spec for API changes
- Update `docs/api/API_GUIDE.md`
- Add examples to Postman collection
- Test all documented endpoints

---

## 🔍 **Code Review Guidelines**

### **For Contributors**
- Be open to feedback
- Respond promptly to comments
- Make requested changes or explain why not
- Be patient during the review process

### **For Reviewers**
- Be constructive and respectful
- Focus on code, not the person
- Explain the reasoning behind suggestions
- Approve when satisfied with changes

---

## 📊 **Quality Standards**

### **Code Quality**
- No linter warnings (backend or frontend)
- Code complexity kept reasonable
- No duplicate code (DRY principle)
- Proper error handling
- Security best practices followed

### **Test Quality**
- Tests are readable and maintainable
- Tests are deterministic (no flaky tests)
- Good test coverage (95%+ backend, 90%+ frontend)
- Integration tests for critical paths

### **Documentation Quality**
- Clear and concise writing
- Up-to-date with code
- Examples included
- Proper formatting

---

## 🎯 **Areas for Contribution**

### **High Priority**
- Performance optimizations
- Additional test coverage
- Documentation improvements
- Bug fixes

### **Medium Priority**
- New features (discuss first)
- UI/UX improvements
- Code refactoring
- Security enhancements

### **Low Priority**
- Code style improvements
- Minor optimizations
- Nice-to-have features

---

## 🆘 **Getting Help**

### **Resources**
- **Documentation**: See [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- **Issues**: Check existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: ops@walacor.com

### **Before Asking**
1. Check the documentation
2. Search existing issues
3. Try debugging yourself
4. Provide complete context when asking

---

## 📝 **License**

By contributing to IntegrityX, you agree that your contributions will be licensed under the same license as the project.

---

## 🙏 **Thank You!**

Your contributions make IntegrityX better for everyone. We appreciate your time and effort!

---

**Last Updated**: October 28, 2024  
**Maintained by**: Walacor Development Team



