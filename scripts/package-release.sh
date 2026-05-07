#!/bin/bash

###############################################################################
# BillingHub Release Packaging Script
# 
# This script prepares the project for release by:
# 1. Cleaning build artifacts
# 2. Removing sensitive files
# 3. Creating a ZIP package
# 4. Generating checksums
# 5. Creating release documentation
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VERSION="${1:-1.0.0}"
RELEASE_DIR="$PROJECT_ROOT/releases"
BUILD_DIR="/tmp/billinghub-build"
PACKAGE_NAME="billinghub-$VERSION"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BillingHub Release Packaging${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Version: $VERSION"
echo "Release Dir: $RELEASE_DIR"
echo ""

# Create release directory
mkdir -p "$RELEASE_DIR"

# Check if build directory exists and clean it
if [ -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}Cleaning previous build...${NC}"
    rm -rf "$BUILD_DIR"
fi

echo -e "${YELLOW}Preparing build directory...${NC}"
mkdir -p "$BUILD_DIR"

# Copy main billing-system
echo -e "${YELLOW}Copying billing-system...${NC}"
cp -r "$PROJECT_ROOT/billing-system" "$BUILD_DIR/$PACKAGE_NAME"

# Copy installer
echo -e "${YELLOW}Copying installer...${NC}"
cp -r "$PROJECT_ROOT/installer" "$BUILD_DIR/$PACKAGE_NAME/"

# Copy website (optional, for reference)
echo -e "${YELLOW}Copying website (for reference)...${NC}"
mkdir -p "$BUILD_DIR/$PACKAGE_NAME/website"
cp "$PROJECT_ROOT/website/index.html" "$BUILD_DIR/$PACKAGE_NAME/website/"
cp "$PROJECT_ROOT/website/download.html" "$BUILD_DIR/$PACKAGE_NAME/website/"
cp "$PROJECT_ROOT/website/docs.html" "$BUILD_DIR/$PACKAGE_NAME/website/"

# Clean up sensitive and unnecessary files
echo -e "${YELLOW}Cleaning unnecessary files...${NC}"

# Remove from package
cd "$BUILD_DIR/$PACKAGE_NAME"

# Remove .env files (users will configure their own)
find . -name ".env*" -type f -delete

# Remove node_modules and composer vendor (users install fresh)
rm -rf node_modules
rm -rf vendor

# Remove storage logs and cache
rm -rf storage/logs/*
rm -rf storage/framework/cache/*
rm -rf storage/framework/sessions/*
rm -rf storage/framework/views/*

# Remove test directories
rm -rf tests/

# Remove git directory
rm -rf .git/
rm -f .gitignore .gitattributes

# Remove IDE and OS files
rm -rf .vscode/
rm -rf .idea/
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete
find . -name "*.log" -delete

# Keep only .env.example
if [ -f ".env.example" ]; then
    echo "Using .env.example as template"
else
    echo -e "${YELLOW}Warning: .env.example not found${NC}"
fi

# Copy composer.json and package.json to root of BUILD for reference
if [ -f "composer.json" ]; then
    cp composer.json "$BUILD_DIR/$PACKAGE_NAME.composer.json"
fi

if [ -f "package.json" ]; then
    cp package.json "$BUILD_DIR/$PACKAGE_NAME.package.json"
fi

# Create main README for distribution
echo -e "${YELLOW}Creating distribution README...${NC}"
cat > "$BUILD_DIR/$PACKAGE_NAME/README.md" << 'EOF'
# BillingHub - Complete Billing & Invoicing System

Welcome to BillingHub! This is the complete, open-source billing system for service providers.

## Quick Start

1. **Extract this package** to your web server directory

2. **Run the web installer:**
   ```
   http://your-domain.com/installer/install.php
   ```

3. **Follow the setup wizard** to configure:
   - Database connection
   - Application settings
   - Admin account

4. **Login and start using:**
   ```
   http://your-domain.com/admin
   ```

## System Requirements

- PHP 8.2 or higher
- MySQL 8.0+ or MariaDB
- Nginx or Apache web server
- Node.js 18+ (for asset compilation)
- Composer (for dependency management)

## Installation Steps

### Step 1: Extract Package
```bash
unzip billinghub-1.0.0.zip
cd billinghub-1.0.0
```

### Step 2: Install Dependencies
```bash
composer install
npm install
npm run build
```

### Step 3: Run Web Installer
Open in your browser:
```
http://your-domain.com/installer/install.php
```

### Step 4: Complete Setup
Follow the wizard - it will:
- Check system requirements
- Create and configure database
- Set up application
- Create admin account

## Features

✅ **Complete Invoicing System**
- Generate and send invoices
- Track payments
- Automatic reminders
- PDF export

✅ **Multiple Payment Gateways**
- Stripe (credit cards)
- PayPal (PayPal payments)
- Bank Transfer (manual)

✅ **Client Portal**
- View invoices
- Manage services
- Submit support tickets
- Download documents

✅ **Admin Dashboard**
- Sales overview
- Revenue tracking
- Customer management
- Payment processing

✅ **Recurring Billing**
- Automatic renewals
- Late fees
- Auto-suspension
- Cancellation rules

✅ **Support Tickets**
- Department routing
- File attachments
- Email notifications
- Status tracking

✅ **Email Templates**
- Fully customizable
- Drag-and-drop editor
- Multiple templates
- Custom variables

✅ **Pterodactyl Integration**
- Game server provisioning
- Automatic service creation
- Node management
- Egg configuration

✅ **Extension System**
- Extend functionality
- Custom hooks
- Plugin support
- Easy installation

## Configuration

After setup, configure via Admin Panel:

### Email
- Set up SMTP provider
- Configure email templates
- Test email sending

### Payment Gateways
- Add Stripe API keys
- Configure PayPal credentials
- Set up bank details

### Pterodactyl (Optional)
- Add Pterodactyl API URL
- Configure nodes and eggs
- Create service products

## Documentation

Full documentation available at:
- Installation: `installer/README.md`
- Website: `website/docs.html`
- Configuration: `.env.example`

## Support

- 📖 Documentation: https://docs.billinghub.local
- 🐛 Report Issues: https://github.com/yourusername/billinghub/issues
- 💬 Discussions: https://github.com/yourusername/billinghub/discussions

## License

BillingHub is open-source software licensed under the MIT license.

## Credits

Built with:
- Laravel 12
- Livewire 4
- Tailwind CSS 4
- MySQL

## Troubleshooting

### Installer shows "Already Installed"
- Delete `.env` file in billing-system directory
- Clear browser cache
- Refresh installer page

### Database Connection Failed
- Verify database credentials
- Check MySQL is running
- Ensure user has database creation privileges

### White Screen After Setup
- Check `storage/logs/laravel.log`
- Verify `.env` file exists
- Run `php artisan cache:clear`

### Permission Errors
```bash
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

## Getting Started

After installation:

1. **Login to Admin Panel**
   - URL: `http://your-domain.com/admin`
   - Email/Password: Set during setup

2. **Create First Product**
   - Go to Products menu
   - Click "Create Product"
   - Set name, price, description

3. **Configure Payment Gateway**
   - Go to Settings → Payment Gateways
   - Add your Stripe/PayPal keys
   - Enable payment methods

4. **Invite First Customer**
   - Go to Users
   - Click "Create User"
   - Send welcome email with login link

5. **Create Invoice**
   - Go to Invoices
   - Click "Create Invoice"
   - Select customer and items
   - Send to customer

## Next Steps

- Customize email templates
- Set up recurring billing rules
- Configure Pterodactyl for game servers
- Add custom extensions
- Set up SSL certificate (HTTPS)
- Configure backups

Happy Billing! 🚀
EOF

# Create CHANGELOG
echo -e "${YELLOW}Creating CHANGELOG...${NC}"
cat > "$BUILD_DIR/$PACKAGE_NAME/CHANGELOG.md" << 'EOF'
# BillingHub Changelog

## Version 1.0.0 (May 2026)

### Initial Release
- ✅ Complete billing and invoicing system
- ✅ Multiple payment gateway support (Stripe, PayPal, Bank Transfer)
- ✅ Admin dashboard with sales overview
- ✅ Client portal with invoice management
- ✅ Recurring billing with auto-renewal
- ✅ Support ticket system with attachments
- ✅ Email template customization
- ✅ Pterodactyl integration for game servers
- ✅ Extension system with hooks
- ✅ Web-based installer
- ✅ REST API
- ✅ User authentication and authorization
- ✅ Product management with options
- ✅ Order management and tracking
- ✅ Invoice PDF generation
- ✅ Email queue system
- ✅ Automated scheduler tasks
- ✅ Database migrations and seeders
- ✅ Comprehensive documentation

### Features
- Fully functional billing system
- Production-ready code
- Clean architecture
- Well-documented
- Easy to extend
EOF

# Create LICENSE
echo -e "${YELLOW}Creating LICENSE...${NC}"
cat > "$BUILD_DIR/$PACKAGE_NAME/LICENSE" << 'EOF'
MIT License

Copyright (c) 2026 BillingHub Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

# Create INSTALL.md
echo -e "${YELLOW}Creating INSTALL.md...${NC}"
cat > "$BUILD_DIR/$PACKAGE_NAME/INSTALL.md" << 'EOF'
# Installation Guide

## Prerequisites

Before installing BillingHub, ensure your server has:

- **PHP** 8.2 or higher
- **MySQL** 8.0+ (or MariaDB 10.6+)
- **Nginx** or **Apache** web server
- **Node.js** 18+ (for frontend compilation)
- **Composer** 2.0+ (for PHP dependencies)
- **Git** (optional, for version control)

### PHP Extensions Required
- openssl
- pdo
- pdo_mysql
- mbstring
- json
- curl
- gd
- zip

## Installation Methods

### Method 1: Web Installer (Recommended)

This is the easiest method and perfect for most users.

1. **Extract Package**
   ```bash
   unzip billinghub-1.0.0.zip
   ```

2. **Upload to Server**
   - Upload all files to `/var/www/billinghub`
   - Set ownership: `chown -R www-data:www-data /var/www/billinghub`
   - Set permissions: `chmod -R 755 /var/www/billinghub`

3. **Access Installer**
   - Open: `http://your-domain.com/installer/install.php`
   - Follow the wizard steps
   - Complete setup

4. **Login**
   - URL: `http://your-domain.com/admin`
   - Use credentials created during setup

### Method 2: Manual Installation

For advanced users or specific configurations.

1. **Extract and Prepare**
   ```bash
   unzip billinghub-1.0.0.zip
   cd billinghub-1.0.0
   ```

2. **Install Dependencies**
   ```bash
   composer install
   npm install
   npm run build
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE billinghub;
   EXIT;
   
   # Update .env with database credentials
   ```

5. **Run Migrations**
   ```bash
   php artisan migrate --seed
   ```

6. **Create Admin User**
   ```bash
   php artisan make:user admin@example.com "Admin Name"
   ```

7. **Build Frontend**
   ```bash
   npm run build
   ```

8. **Access Application**
   - URL: `http://your-domain.com`

## Configuration

### .env File
Key settings to configure:

```env
APP_NAME=BillingHub
APP_URL=https://your-domain.com
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=billinghub
DB_USERNAME=root
DB_PASSWORD=
MAIL_DRIVER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Web Server Configuration

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/billinghub;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    index index.html index.htm index.php;

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/billinghub

    <Directory /var/www/billinghub>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### SSL Certificate (Let's Encrypt)

```bash
sudo certbot certonly --webroot -w /var/www/billinghub -d your-domain.com
```

Update Nginx config to use SSL:
```nginx
listen 443 ssl http2;
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

## Post-Installation

### 1. Email Configuration
- Set up SMTP details in Admin → Settings
- Test email sending

### 2. Payment Gateways
- Add Stripe API keys
- Configure PayPal credentials
- Enable payment methods

### 3. Email Templates
- Customize email templates
- Set up notification emails

### 4. Products
- Create service products
- Set pricing and options

### 5. Pterodactyl (Optional)
- Configure Pterodactyl URL and API token
- Add nodes and eggs
- Create game server products

## Queue Setup (Production)

Set up job queue for background tasks:

### Supervisor Configuration
```ini
[program:billinghub-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/billinghub/artisan queue:work
autostart=true
autorestart=true
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/billinghub/storage/logs/queue.log
```

### Cron Scheduler
```bash
* * * * * cd /var/www/billinghub && php artisan schedule:run >> /dev/null 2>&1
```

## Troubleshooting

### 500 Error
```bash
# Check logs
tail -f storage/logs/laravel.log

# Clear cache
php artisan cache:clear
php artisan view:cache

# Check permissions
chmod -R 755 storage/ bootstrap/cache/
```

### Database Connection Error
```bash
# Verify credentials in .env
# Test connection
mysql -h localhost -u root -p billinghub

# If missing database
mysql -u root -p -e "CREATE DATABASE billinghub;"
```

### Permission Denied Errors
```bash
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
chown -R www-data:www-data storage/
chown -R www-data:www-data bootstrap/cache/
```

## Support

For issues:
- Check `storage/logs/laravel.log`
- Review documentation
- Open GitHub issue with error details

EOF

# Now create the ZIP file
echo -e "${YELLOW}Creating ZIP package...${NC}"
cd "$BUILD_DIR"

# Create ZIP with progress
zip -r -q "$RELEASE_DIR/$PACKAGE_NAME.zip" "$PACKAGE_NAME"

# Calculate size
SIZE=$(du -sh "$RELEASE_DIR/$PACKAGE_NAME.zip" | cut -f1)

echo -e "${GREEN}✓ Package created: $RELEASE_DIR/$PACKAGE_NAME.zip ($SIZE)${NC}"

# Generate checksums
echo -e "${YELLOW}Generating checksums...${NC}"
cd "$RELEASE_DIR"

if command -v sha256sum &> /dev/null; then
    sha256sum "$PACKAGE_NAME.zip" > "$PACKAGE_NAME.sha256"
    echo -e "${GREEN}✓ SHA256: $(cat $PACKAGE_NAME.sha256)${NC}"
fi

if command -v md5sum &> /dev/null; then
    md5sum "$PACKAGE_NAME.zip" > "$PACKAGE_NAME.md5"
    echo -e "${GREEN}✓ MD5: $(cat $PACKAGE_NAME.md5)${NC}"
fi

# Create release notes
echo -e "${YELLOW}Creating release notes...${NC}"
cat > "$RELEASE_DIR/RELEASE_NOTES_v$VERSION.md" << EOF
# BillingHub v$VERSION Release

**Release Date:** $(date '+%B %d, %Y')

## Download

- **Package:** billinghub-$VERSION.zip
- **Size:** $SIZE

## SHA256 Checksum
\`\`\`
$(cat $PACKAGE_NAME.sha256)
\`\`\`

## Installation

1. Download the ZIP file
2. Extract to your web server
3. Open \`/installer/install.php\` in browser
4. Follow the setup wizard

## What's Included

- Complete Laravel billing system
- Web-based installer
- Admin dashboard
- Client portal
- Payment gateway integration (Stripe, PayPal, Bank Transfer)
- Support ticket system
- Email templates
- Pterodactyl integration
- Extension system
- REST API
- Comprehensive documentation

## Requirements

- PHP 8.2+
- MySQL 8.0+
- Nginx or Apache
- Node.js 18+
- Composer 2.0+

## Quick Start

\`\`\`bash
# Extract
unzip billinghub-$VERSION.zip

# Run installer
# Open http://your-domain.com/installer/install.php
\`\`\`

## New in This Release

- Initial release with all core features
- Web-based installation wizard
- Production-ready code
- Comprehensive documentation

## Known Issues

None at this time.

## Getting Help

- Documentation: Check \`INSTALL.md\` and \`README.md\`
- Issues: https://github.com/yourusername/billinghub/issues
- Discussions: https://github.com/yourusername/billinghub/discussions

---

**Thank you for using BillingHub!** 🚀
EOF

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Release Package Created Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📦 Release Directory: $RELEASE_DIR"
echo "📦 Package: $PACKAGE_NAME.zip ($SIZE)"
echo "📋 Files created:"
echo "   - $PACKAGE_NAME.zip"
echo "   - $PACKAGE_NAME.sha256"
echo "   - $PACKAGE_NAME.md5"
echo "   - RELEASE_NOTES_v$VERSION.md"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Upload to GitHub Releases"
echo "2. Update website download links"
echo "3. Create GitHub release with notes"
echo "4. Announce on social media"
echo ""

# Cleanup
rm -rf "$BUILD_DIR"

echo -e "${GREEN}✓ Done!${NC}"
