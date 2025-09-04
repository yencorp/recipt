# Git Flow Workflow Guide - Receipt OCR System

## Branch Strategy Overview

This project follows **Git Flow** branching strategy with conventional commits for the Receipt OCR Management System.

### Branch Structure

```
main (production-ready releases)
├── develop (integration branch)
    ├── feature/ocr-container-setup
    ├── feature/ml-pipeline-integration  
    ├── feature/frontend-dashboard
    ├── feature/api-gateway-setup
    └── hotfix/critical-bug-fix (when needed)
```

## Branch Types & Naming Conventions

### 🚀 Main Branch (`main`)
- **Purpose**: Production-ready code only
- **Protection**: Direct pushes disabled, requires PR approval
- **Merges from**: `develop` (releases), `hotfix/*` (critical fixes)

### 🔧 Development Branch (`develop`) 
- **Purpose**: Integration and testing of features
- **Protection**: Requires PR review for merges
- **Merges from**: `feature/*` branches
- **Current Status**: ✅ Created and tracked

### ⭐ Feature Branches (`feature/*`)
- **Naming**: `feature/[scope]-[description]`
- **Examples**:
  - `feature/ocr-container-setup`
  - `feature/ml-pipeline-dqn-agent`  
  - `feature/frontend-dashboard-ui`
  - `feature/api-auth-service`
- **Lifecycle**: Branch from `develop` → Work → PR to `develop` → Delete

### 🔥 Hotfix Branches (`hotfix/*`)
- **Naming**: `hotfix/[issue-description]`
- **Purpose**: Critical production fixes
- **Lifecycle**: Branch from `main` → Fix → PR to both `main` and `develop`

## Workflow Commands

### Starting New Feature
```bash
# Switch to develop and update
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/ocr-ml-integration

# Work on feature...
git add .
git commit -m "feat(ocr): implement DQN-based OCR engine selection"

# Push feature branch
git push -u origin feature/ocr-ml-integration
```

### Completing Feature
```bash
# Create Pull Request to develop branch
# After PR approval and merge:
git checkout develop
git pull origin develop
git branch -d feature/ocr-ml-integration  # Delete local branch
```

### Release Process
```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# Finalize release (version bump, final testing)
git commit -m "chore(release): prepare v1.0.0"

# Merge to main
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "Release v1.0.0: Initial Receipt OCR System"

# Merge back to develop
git checkout develop
git merge release/v1.0.0

# Push everything
git push origin main develop --tags
git branch -d release/v1.0.0
```

## Commit Message Convention

Following **Conventional Commits** specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New feature
- `fix`: Bug fix  
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Scopes (Project-Specific)
- `ocr`: OCR processing and ML components
- `api`: Backend API services
- `frontend`: React frontend applications
- `db`: Database schema and migrations
- `deploy`: Deployment and infrastructure
- `ml`: Machine learning and AI components

### Examples
```bash
feat(ocr): implement YOLOv8 receipt detection
fix(api): resolve authentication token expiration issue  
docs(readme): add setup instructions for ML pipeline
refactor(frontend): optimize dashboard component structure
test(ocr): add unit tests for DQN agent selection
chore(deploy): update Docker configuration for production
```

## Development Environment Setup

### Required Tools
```bash
# Git configuration
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up conventional commits template
git config --global commit.template .gitmessage
```

### Branch Protection Rules (Repository Settings)
1. **Main Branch**:
   - Require pull request reviews (2 reviewers)
   - Dismiss stale reviews when new commits pushed
   - Require status checks to pass
   - Require branches to be up to date
   - Include administrators in restrictions

2. **Develop Branch**:
   - Require pull request reviews (1 reviewer)  
   - Require status checks to pass
   - Allow force pushes for administrators

### Automated Workflows
- **CI/CD Pipeline**: Triggers on PR to `develop` and `main`
- **Code Quality**: ESLint, Black (Python), type checking
- **Security Scanning**: Dependency vulnerability checks
- **ML Model Validation**: Model performance benchmarks

## Quick Reference Commands

```bash
# Check current branch and status
git status
git branch -a

# Switch branches
git checkout develop
git checkout main  
git checkout -b feature/new-feature

# Update from remote
git pull origin develop
git fetch --all

# Create and push feature
git checkout -b feature/amazing-feature
git add .
git commit -m "feat(scope): add amazing functionality"
git push -u origin feature/amazing-feature

# Clean up after merge
git checkout develop
git pull origin develop
git branch -d feature/amazing-feature
git remote prune origin  # Clean remote tracking branches
```

## Team Collaboration Guidelines

### Pull Request Template
- Clear title following conventional commits
- Detailed description of changes
- Link to related issues/tasks
- Screenshots/demos for UI changes
- Checklist for testing completed
- Request specific reviewers

### Code Review Process
1. **Author**: Create PR with proper template
2. **Reviewers**: Test functionality, review code quality
3. **CI/CD**: Automated tests must pass
4. **Merge**: Squash commits for clean history
5. **Cleanup**: Delete feature branch after merge

### Emergency Hotfix Process
1. Create `hotfix/[issue]` from `main`
2. Fix critical issue with minimal changes
3. Test thoroughly in isolation
4. PR to both `main` and `develop`
5. Deploy immediately after `main` merge
6. Ensure `develop` gets the fix

---

**Repository**: http://feelinglucky.synology.me:3052/jopark/recipt.git
**Current Status**: Git Flow initialized ✅
**Main Branch**: `main` (production)
**Development Branch**: `develop` (active)