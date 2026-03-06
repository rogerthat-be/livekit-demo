# LiveKit Streaming Application

Docker setup voor LiveKit + token server, met optionele losse client hosting (bv. GitHub Pages).

## Vereisten

- Docker + Docker Compose
- VPS + domeinen (aanbevolen)
- Open poorten: `7880/tcp`, `7881/udp`, `3478/tcp+udp`, `49160-49200/udp`

## Installatie vanaf git clone

```bash
git clone <jouw-repo>
cd livekit
```

### Snelle setup

```bash
./scripts/docker-setup.sh
```

Dit script configureert:
- `livekit.yaml` met `node_ip`
- `.env` met API key/secret
- `client/.env` met `VITE_TOKEN_URL` en `VITE_LIVEKIT_URL`

### Handmatige setup

1) Configureer LiveKit:

```bash
cp livekit.yaml.example livekit.yaml
nano livekit.yaml
```

Zet `node_ip` op je publieke VPS IP.

2) Configureer secrets + CORS voor docker compose:

```bash
cp .env.docker .env
nano .env
```

Voorbeeld:

```env
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
FRONTEND_ORIGINS=https://stream.jouwdomein.com,https://jouwnaam.github.io
VITE_TOKEN_URL=https://api.jouwdomein.com/token
VITE_LIVEKIT_URL=wss://livekit.jouwdomein.com
VITE_STUN_URL=stun:turn.jouwdomein.com:3478
VITE_TURN_URL=turn:turn.jouwdomein.com:3478?transport=udp
VITE_TURN_USERNAME=turnuser
VITE_TURN_PASSWORD=vervang-met-sterk-wachtwoord

TURN_REALM=turn.jouwdomein.com
TURN_USERNAME=turnuser
TURN_PASSWORD=vervang-met-sterk-wachtwoord
TURN_MIN_PORT=49160
TURN_MAX_PORT=49200
```

Let op: deze `VITE_*` waarden worden tijdens `docker compose build` in de client gebakken.

3) Configureer client URLs:

```bash
cp client/.env.example client/.env
nano client/.env
```

Voor domeinen + SSL:

```env
VITE_TOKEN_URL=https://api.jouwdomein.com/token
VITE_LIVEKIT_URL=wss://livekit.jouwdomein.com
```

Voor lokale dev op dezelfde host:

```env
VITE_TOKEN_URL=/token
VITE_LIVEKIT_URL=ws://JOUW_VPS_IP:7880
```

4) Start backend services:

```bash
docker compose up -d --build livekit coturn token-server
```

Optioneel: start ook `client` container als je client niet extern host.

## Nginx Proxy Manager (domein setup)

Maak 2 Proxy Hosts op je VPS:

1. Token API
- Domain: `api.jouwdomein.com`
- Forward: `livekit-token-server:3001`
- SSL: aan

2. LiveKit websocket
- Domain: `livekit.jouwdomein.com`
- Forward: `livekit-server:7880`
- WebSocket support: aan
- SSL: aan

Advanced config:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_http_version 1.1;
proxy_read_timeout 3600s;
proxy_send_timeout 3600s;
```

## Belangrijke noot

UDP `7881` kan niet via Nginx Proxy Manager en moet direct open staan in firewall.

## Coturn (TURN fallback)

Voor netwerken waar UDP of directe P2P/relay connectiviteit beperkt is, draait deze stack ook een `coturn` service.

- Browser clients gebruiken `VITE_STUN_URL` en `VITE_TURN_*` als ICE servers.
- Zet `TURN_REALM`, `TURN_USERNAME`, `TURN_PASSWORD` in `.env`.
- Open firewall voor `3478/tcp`, `3478/udp`, en relay-range `49160-49200/udp`.
- Gebruik in productie sterke TURN credentials.

## Commando's

```bash
docker compose ps
docker compose logs -f
docker compose restart token-server
docker compose restart livekit
docker compose restart coturn
docker compose down
```

## Client extern hosten (GitHub Pages)

Je kunt `client` volledig los hosten.

1. Build client met productie-URLs in `client/.env`.
2. Deploy de inhoud van `client/dist` naar GitHub Pages.
3. Zorg dat `FRONTEND_ORIGINS` op de token server je GH Pages origin bevat.

## Structuur

```text
livekit/
├── client/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   ├── host.html
│   ├── watch.html
│   └── src/
├── server/
│   ├── Dockerfile
│   ├── package.json
│   └── token-server.js
├── scripts/
│   └── docker-setup.sh
├── docker-compose.yml
├── livekit.yaml.example
└── README.md
```
