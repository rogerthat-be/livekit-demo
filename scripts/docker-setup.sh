#!/bin/bash

# LiveKit Docker Quick Setup Script
# Dit script helpt bij de initiële configuratie

set -e

echo "🐳 LiveKit Docker Setup"
echo "======================="
echo ""

# Kleuren
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check of Docker draait
if ! docker ps >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    exit 1
fi

# Check of docker compose beschikbaar is
if ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: docker compose not available${NC}"
    echo "Install Docker Compose v2 plugin"
    exit 1
fi

echo -e "${BLUE}📋 Configuration Setup${NC}"
echo ""

# 1. Domeinen (aanbevolen)
read -p "Use domains + SSL? (y/n): " USE_DOMAINS

if [[ $USE_DOMAINS =~ ^[Yy]$ ]]; then
    read -p "Enter LiveKit domain (e.g., livekit.example.com): " LIVEKIT_DOMAIN
    read -p "Enter Token API domain (e.g., api.example.com): " TOKEN_DOMAIN
    read -p "Enter TURN domain (e.g., turn.example.com, leave empty to use VPS IP): " TURN_DOMAIN
    read -p "Enter frontend origin (e.g., https://user.github.io): " FRONTEND_ORIGIN
    read -p "Enter VPS public IP (for livekit.yaml node_ip): " VPS_IP

    if [ -z "$LIVEKIT_DOMAIN" ] || [ -z "$TOKEN_DOMAIN" ] || [ -z "$FRONTEND_ORIGIN" ] || [ -z "$VPS_IP" ]; then
        echo -e "${RED}❌ Domains, frontend origin and VPS IP are required${NC}"
        exit 1
    fi

    LIVEKIT_URL="wss://$LIVEKIT_DOMAIN"
    TOKEN_URL="https://$TOKEN_DOMAIN/token"
    FRONTEND_ORIGINS="$FRONTEND_ORIGIN"
    TURN_HOST="$TURN_DOMAIN"
    if [ -z "$TURN_HOST" ]; then
        TURN_HOST="$VPS_IP"
    fi
    echo -e "${GREEN}✓ Using domain setup${NC}"
    echo -e "${GREEN}  LiveKit: $LIVEKIT_URL${NC}"
    echo -e "${GREEN}  Token:   $TOKEN_URL${NC}"
else
    read -p "Enter your VPS public IP address: " VPS_IP
    if [ -z "$VPS_IP" ]; then
        echo -e "${RED}❌ IP address is required${NC}"
        exit 1
    fi

    LIVEKIT_URL="ws://$VPS_IP:7880"
    TOKEN_URL="http://$VPS_IP:3001/token"
    FRONTEND_ORIGINS="*"
    TURN_HOST="$VPS_IP"
    echo -e "${YELLOW}⚠️  Using IP fallback (no SSL)${NC}"
fi

TURN_REALM="$TURN_HOST"
TURN_USERNAME="turnuser"
TURN_PASSWORD=$(openssl rand -hex 12)
VITE_STUN_URL="stun:$TURN_HOST:3478"
VITE_TURN_URL="turn:$TURN_HOST:3478?transport=udp"

# 3. Genereer API keys
echo ""
echo -e "${BLUE}🔐 Generating API Keys${NC}"
API_KEY=$(openssl rand -hex 16)
API_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✓ Generated secure API keys${NC}"

# 4. Update livekit.yaml
echo ""
echo -e "${BLUE}📝 Configuring livekit.yaml${NC}"
cat > livekit.yaml << EOF
port: 7880
rtc:
  udp_port: 7881
  tcp_port: 7881
    use_external_ip: true

keys:
  $API_KEY: "$API_SECRET"
EOF
echo -e "${GREEN}✓ livekit.yaml configured${NC}"

# 5. Update .env voor docker-compose
echo -e "${BLUE}📝 Configuring .env.docker${NC}"
cat > .env << EOF
# LiveKit API Credentials
LIVEKIT_API_KEY=$API_KEY
LIVEKIT_API_SECRET=$API_SECRET
FRONTEND_ORIGINS=$FRONTEND_ORIGINS
VITE_TOKEN_URL=$TOKEN_URL
VITE_LIVEKIT_URL=$LIVEKIT_URL
VITE_STUN_URL=$VITE_STUN_URL
VITE_TURN_URL=$VITE_TURN_URL
VITE_TURN_USERNAME=$TURN_USERNAME
VITE_TURN_PASSWORD=$TURN_PASSWORD
TURN_REALM=$TURN_REALM
TURN_USERNAME=$TURN_USERNAME
TURN_PASSWORD=$TURN_PASSWORD
TURN_MIN_PORT=49160
TURN_MAX_PORT=49200
EOF
echo -e "${GREEN}✓ .env configured${NC}"

# 6. Update client/.env
echo -e "${BLUE}📝 Configuring client/.env${NC}"
cat > client/.env << EOF
# Client configuration
VITE_TOKEN_URL=$TOKEN_URL
VITE_LIVEKIT_URL=$LIVEKIT_URL
VITE_STUN_URL=$VITE_STUN_URL
VITE_TURN_URL=$VITE_TURN_URL
VITE_TURN_USERNAME=$TURN_USERNAME
VITE_TURN_PASSWORD=$TURN_PASSWORD
EOF
echo -e "${GREEN}✓ client/.env configured${NC}"

# 7. Toon samenvatting
echo ""
echo -e "${GREEN}✅ Configuration Complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📋 Configuration Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VPS IP:           $VPS_IP"
echo "Token URL:        $TOKEN_URL"
echo "LiveKit URL:      $LIVEKIT_URL"
echo "TURN Host:        $TURN_HOST"
echo "TURN Username:    $TURN_USERNAME"
echo "TURN Password:    [HIDDEN]"
echo "Frontend Origins: $FRONTEND_ORIGINS"
echo "API Key:          $API_KEY"
echo "API Secret:       [HIDDEN]"
echo ""

if [[ ! $USE_DOMAINS =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Firewall Ports Required:${NC}"
    echo "  sudo ufw allow 7880/tcp"
    echo "  sudo ufw allow 7881/udp"
    echo "  sudo ufw allow 5173/tcp"
    echo "  sudo ufw allow 3001/tcp"
    echo "  sudo ufw allow 3478/tcp"
    echo "  sudo ufw allow 3478/udp"
    echo "  sudo ufw allow 49160:49200/udp"
    echo ""
fi

echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Open firewall ports (if needed)"
echo "2. Start services:"
echo "   ${GREEN}docker compose up -d --build${NC}"
echo ""
echo "3. Check status:"
echo "   ${GREEN}docker compose ps${NC}"
echo "   ${GREEN}docker compose logs -f${NC}"
echo ""

if [[ $USE_DOMAINS =~ ^[Yy]$ ]]; then
    echo "4. Configure Nginx Proxy Manager:"
    echo "   - WebSocket to: livekit-server:7880"
    echo "   - Token API to: livekit-token-server:3001"
    echo "   - Enable SSL and WebSocket support"
    echo ""
fi

echo "5. Client endpoints:"
echo "   - Token:   $TOKEN_URL"
echo "   - LiveKit: $LIVEKIT_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 8. Vraag of direct starten
echo ""
read -p "Start services now? (y/n): " START_NOW

if [[ $START_NOW =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}🚀 Starting services...${NC}"
    docker compose up -d --build
    
    echo ""
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    echo "View logs with: docker compose logs -f"
else
    echo ""
    echo "Start manually with: docker compose up -d --build"
fi

echo ""
echo -e "${GREEN}Setup complete! 🎉${NC}"
