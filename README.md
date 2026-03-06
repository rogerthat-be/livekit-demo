# LiveKit Streaming Demo

## Over dit project

Dit project is een **eenvoudige live streaming applicatie** op basis van **LiveKit**. Eén gebruiker treedt op als **host** en zendt audio en video uit. Andere gebruikers treden op als **viewers** en kunnen live meekijken in dezelfde room.

De applicatie bestaat uit meerdere onderdelen die samenwerken:

- een **frontend** in de browser,
- een **token-server** in Node.js/Express,
- een **LiveKit server** voor signaling en media-routing,
- een **Coturn server** voor STUN/TURN,
- en een **Docker Compose setup** die alles samen opstart.

Het project is dus niet alleen een frontend-oefening, maar vooral een **full-stack realtime streaming demo** waarin browsercode, backendlogica, networking en deployment samenkomen.

---

## Leerdoel van dit project

Deze repo is erg geschikt voor studenten die willen begrijpen:

- hoe **live video in de browser** werkt,
- waarom **WebRTC** meer is dan alleen “een video tonen”,
- waarom een **token-server** nodig is,
- wat **STUN**, **TURN** en **ICE** zijn,
- waarom een **VPS** nodig is voor dit soort projecten,
- en hoe een applicatie met meerdere services via **Docker Compose** wordt uitgerold.

Met andere woorden: dit project leert niet alleen **hoe je streamt**, maar ook **waarom de volledige infrastructuur nodig is**.

---

## Wat doet de applicatie concreet?

De flow is in grote lijnen als volgt:

1. De **host** opent `host.html`.
2. De host kiest een roomnaam, bijvoorbeeld `demo`.
3. De frontend vraagt een token op bij de **token-server**.
4. De token-server maakt met de **LiveKit Server SDK** een veilig JWT-token aan.
5. De host verbindt met de **LiveKit room**.
6. De host publiceert camera- en microfoontracks.
7. Een **viewer** opent `watch.html`.
8. De viewer vraagt ook een token op.
9. De viewer verbindt met dezelfde room.
10. De viewer ontvangt de videotracks van de host en speelt die af in de browser.

De belangrijkste architectuurkeuze is hier dat media **niet zomaar rechtstreeks handmatig tussen twee browsers** wordt geregeld, maar via **LiveKit als SFU**.

---

## Waarom LiveKit?

Bij realtime video in de browser bots je snel op complexe problemen:

- browsers moeten elkaar kunnen vinden,
- mediastreams moeten met lage latency verstuurd worden,
- firewalls en NAT kunnen verbindingen blokkeren,
- en meerdere kijkers tegelijk bedienen is inefficiënt met pure peer-to-peer.

**LiveKit** lost een groot deel van die complexiteit op door:

- signaling te beheren,
- rooms en participants te beheren,
- mediatracks te routeren,
- en een schaalbaardere architectuur te bieden dan pure browser-to-browser streaming.

LiveKit werkt hier als een **SFU (Selective Forwarding Unit)**. Dat betekent:

- de host stuurt zijn stream één keer naar de server,
- de server stuurt die stream door naar de viewers.

Dat is veel efficiënter dan wanneer de host zijn stream apart naar elke viewer zou moeten sturen.

---

## End-to-end architectuur

De stack bestaat uit de volgende hoofddelen:

### 1. Frontend (`client/`)
De frontend bevat de browserpagina’s en JavaScript-logica voor:

- roomnaam ingeven,
- token ophalen,
- verbinden met LiveKit,
- lokale tracks publiceren,
- remote tracks ontvangen en tonen.

Belangrijke bestanden:

- `client/host.html`
- `client/watch.html`
- `client/src/host.js`
- `client/src/watch.js`
- `client/src/lib/livekit.js`

### 2. Token-server (`server/`)
De token-server is een kleine Express-app die veilige tokens uitdeelt.

Belangrijk bestand:

- `server/token-server.js`

Die server gebruikt:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

om een JWT te signeren. Daardoor blijven de geheime sleutels **server-side**.

### 3. LiveKit server
De LiveKit server beheert:

- signaling,
- room management,
- participant management,
- media-routing.

### 4. Coturn server
Coturn levert:

- **STUN**,
- **TURN**,
- relay-functionaliteit wanneer directe verbindingen niet lukken.

### 5. Docker Compose
`docker-compose.yml` start en verbindt alle services samen.

---

## Hoe werkt de host-flow precies?

Wanneer de host op “Start” klikt, gebeurt technisch dit:

1. De roomnaam wordt gelezen uit het formulier.
2. De frontend vraagt via `/token` een token op.
3. De token-server maakt een `AccessToken` aan.
4. De frontend maakt een `Room` object aan via `livekit-client`.
5. De browser verbindt met de LiveKit WebSocket URL.
6. De browser maakt lokale audio- en videotracks aan.
7. De host publiceert deze tracks naar LiveKit.
8. De lokale videotrack wordt ook aan het lokale video-element gekoppeld.

In `client/src/host.js` zie je daarvoor onder andere:

- `new Room(createRoomOptions())`
- `fetchToken(...)`
- `room.connect(wsUrl, token)`
- `createLocalTracks({ audio: true, video: true })`
- `room.localParticipant.publishTrack(t)`

---

## Hoe werkt de viewer-flow precies?

Wanneer de viewer op “Join” klikt:

1. De roomnaam wordt gelezen.
2. De frontend vraagt een token op met rol `viewer`.
3. De viewer verbindt met dezelfde LiveKit room.
4. Zodra de host publiceert, ontvangt de viewer remote tracks.
5. Bij `trackSubscribed` wordt de videotrack aan het `<video>` element gekoppeld.

In `client/src/watch.js` gebeurt dat via events zoals:

- `room.on('trackSubscribed', ...)`
- `room.on('trackUnsubscribed', ...)`

---

## Waarom is een token-server nodig?

De browser mag nooit zelf beschikken over:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

Als je die in de frontend zou zetten, kan iedereen ze uitlezen. Daarom vraagt de frontend een token aan bij een aparte backend.

De backend beslist vervolgens:

- tot welke room iemand toegang krijgt,
- of iemand mag publishen,
- of iemand alleen mag subscriben.

In deze repo gebeurt dat met:

```js
  token.addGrant({
    roomJoin: true,
    room,
    canPublish: role === 'host',
    canSubscribe: true,
  })
```

Dat is een belangrijk beveiligingsprincipe: **de frontend vraagt toegang, maar de backend kent de rechten toe**.

---

## Waarom Coturn en TURN belangrijk zijn

Veel studenten testen realtime apps op één lokaal netwerk en denken dat alles klaar is zodra het daar werkt. In echte netwerken ontstaan echter problemen door:

- NAT,
- firewalls,
- bedrijfsnetwerken,
- mobiele netwerken,
- geblokkeerde UDP-verbindingen.

Daarom bevat deze repo ook **Coturn**. Dat is een open source **STUN/TURN server**.

### STUN
STUN helpt een client te ontdekken welk publiek IP-adres zichtbaar is aan de buitenkant van het netwerk.

### TURN
TURN werkt als een **relay-server**. Als een directe verbinding niet lukt, kan media via TURN lopen.

Dat is cruciaal voor robuustheid. Zonder TURN zie je vaak het klassieke probleem:

- token ophalen lukt,
- room joinen lukt,
- signaling werkt,
- maar video blijft zwart.

Dat betekent meestal dat de controleverbinding werkt, maar het effectieve mediapad niet.

---

## Waarom een VPS nodig is

Deze stack kan niet volledig draaien op een gewone statische hostingdienst.

Je hebt een server nodig die:

- Docker containers draait,
- een Node.js backend draait,
- LiveKit laat draaien,
- UDP-poorten kan openzetten,
- Coturn bereikbaar maakt,
- en idealiter DNS + SSL ondersteunt.

Daarom gebruik je typisch een **VPS (Virtual Private Server)**.

Een VPS is een virtuele machine die je huurt bij een provider. Je krijgt daar controle over:

- het besturingssysteem,
- open poorten,
- firewallregels,
- Docker,
- reverse proxies,
- domeinen en certificaten.

Voor dit soort project is een VPS logischer dan iets zoals GitHub Pages, omdat GitHub Pages alleen **statische frontend files** kan hosten, niet de volledige realtime stack.

---

## Wat staat er in deze repo?

```text
livekit-demo-main/
├── client/
│   ├── host.html
│   ├── watch.html
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
├── server/
│   ├── Dockerfile
│   ├── package.json
│   └── token-server.js
├── docs/
│   └── RANDINFO-LIVEKIT-STACK.md
├── scripts/
│   └── docker-setup.sh
├── docker-compose.yml
├── livekit.yaml.example
└── README.md
```

---

## Tech stack in één overzicht

### Frontend
- HTML
- vanilla JavaScript
- Vite
- livekit-client
- Nginx (om de build te serveren in de client container)

### Backend
- Node.js
- Express
- cors
- dotenv
- livekit-server-sdk

### Realtime / media
- WebRTC
- LiveKit
- ICE
- STUN
- TURN
- Coturn
- SFU architectuur

### Deployment / infrastructuur
- Docker
- Docker Compose
- VPS
- DNS
- SSL / HTTPS / WSS
- eventueel Nginx Proxy Manager

---

## Belangrijke aandachtspunten in deze repo

### 1. `VITE_*` variabelen zijn build-time configuratie
Deze variabelen worden in de frontend ingebakken tijdens de build. Als je een `VITE_*` waarde wijzigt, moet je de client opnieuw builden.

### 2. CORS staat momenteel open
In `server/token-server.js` staat tijdelijk:

```js
app.use(cors({
  origin: '*',
}))
```

Dat is bruikbaar voor een demo, maar in productie wil je dit beperken.

### 3. TURN moet niet alleen geconfigureerd, maar ook echt bereikbaar zijn
Een ingevulde `.env` alleen is niet genoeg. TURN vereist ook open poorten en een correcte rebuild van de client.

### 4. Geen database
Dat is geen fout. De repo focust op realtime streaming. Extra functionaliteit zoals gebruikersbeheer, chat of historiek zou later een database vereisen.

### 5. Kleine debug-onzorgvuldigheid in `watch.js`
`getIceEnvDebug()` geeft `stunUrls` en `turnUrls` terug, maar de logregels in `watch.js` verwijzen naar `startupIceEnv.stunUrl` en `startupIceEnv.turnUrl`. Daardoor zullen die debugregels geen correcte waarde tonen. Functioneel breekt dat de app niet, maar als documentatiepunt is dit goed om te vermelden.

---

## Aangeraden documentatiestructuur

Deze repo werkt het best met meerdere README/documentatiebestanden:

- `README.md` → algemeen projectoverzicht
- `docs/ARCHITECTUUR.md` → volledige systeemuitleg
- `docs/TECH-STACK.md` → technologieën in detail
- `docs/DEPLOYMENT.md` → VPS, poorten, Docker, domeinen, SSL
- `docs/TROUBLESHOOTING.md` → typische fouten en debugging

De bestanden in deze map zijn daarvoor bedoeld.

## Installatie en deployment

Voor achtergrond en terminologie van de hele stack (WebRTC, TURN, LiveKit, Docker, Compose, VPS/Hostinger, NPM, troubleshooting), zie ook:

- `docs/RANDINFO-LIVEKIT-STACK.md`

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
- `livekit.yaml` met `use_external_ip: true`
- `.env` met API key/secret
- `client/.env` met `VITE_TOKEN_URL` en `VITE_LIVEKIT_URL`

### Handmatige setup

1) Configureer LiveKit:

```bash
cp livekit.yaml.example livekit.yaml
nano livekit.yaml
```

Gebruik in productie `use_external_ip: true` (standaard in deze template).

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
VITE_TURN_URL=turn:turn.jouwdomein.com:3478?transport=udp,turn:turn.jouwdomein.com:3478?transport=tcp
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

## Client via Docker hosten

Als je `host.html` / `watch.html` via de `client` container serveert:

1. Zet alle client variabelen in root `.env` (`VITE_TOKEN_URL`, `VITE_LIVEKIT_URL`, `VITE_STUN_URL`, `VITE_TURN_*`).
2. Build en start de client container opnieuw:

```bash
docker compose up -d --build --force-recreate client
```

3. Open de client op `http://<server-ip>:5173`.

Belangrijk:
- `client/.env` wordt gebruikt voor losse/externe client builds.
- Voor Docker-client is root `.env` leidend (via build args in `docker-compose.yml`).
- Na elke wijziging in `VITE_*` moet je opnieuw `--build` doen.

## Nginx Proxy Manager (domein setup)

Maak 3 Proxy Hosts op je VPS (als je client ook via Docker draait):

1. Client UI
- Domain: `portal.jouwdomein.com`
- Forward: `livekit-client:80`
- SSL: aan

2. Token API
- Domain: `api.jouwdomein.com`
- Forward: `livekit-token-server:3001`
- SSL: aan

3. LiveKit websocket
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
TURN/Coturn (`3478/tcp+udp` en `49160-49200/udp`) gaat ook niet via Nginx Proxy Manager en moet direct open staan.

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
