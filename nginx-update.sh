#!/bin/bash

# Update Nginx config to add cache-busting headers
ssh -i "$HOME/.ssh/vps_key" -o StrictHostKeyChecking=no root@14.225.217.139 -p 22 << 'EOF'

# Backup current config
cp /etc/nginx/sites-available/trunglq8.com /etc/nginx/sites-available/trunglq8.com.bak

# Add cache control headers for static assets
sed -i '/location \/ {/a\        # Disable caching for development\n        add_header Cache-Control "no-cache, no-store, must-revalidate";\n        add_header Pragma "no-cache";\n        add_header Expires "0";' /etc/nginx/sites-available/trunglq8.com

# Test and reload nginx
nginx -t && systemctl reload nginx

echo "Nginx config updated with cache-busting headers"
EOF
