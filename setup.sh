#!/bin/bash
# Telegram Brush Cleaner Bot Setup

# 1. Update & install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv git libgl1 libglib2.0-0 curl unzip

# 2. Create project folder
mkdir -p ~/telegram-cleaner-bot
cd ~/telegram-cleaner-bot

# 3. Create Python virtual env
python3 -m venv venv
source venv/bin/activate

# 4. Install Python packages
cat > requirements.txt <<EOL
python-telegram-bot==20.7
flask
opencv-python
numpy
pillow
EOL

pip install --no-cache-dir -r requirements.txt

# 5. Create project structure
mkdir -p bot ai web/uploads web/outputs web/static/js web/templates
touch config.py
touch bot/__init__.py bot/bot.py
touch ai/__init__.py ai/cleaner.py
touch web/__init__.py web/app.py web/templates/index.html web/static/js/brush.js

echo "✅ Setup complete. Edit config.py to add your BOT_TOKEN and WEB_APP_URL"
