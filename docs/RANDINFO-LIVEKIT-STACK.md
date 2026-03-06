# Randinfo: LiveKit, WebRTC, TURN, Docker en VPS

Deze pagina bundelt achtergrondinformatie over de volledige stack in logische blokken. Het doel is context geven: wat elk onderdeel doet, hoe de onderdelen samenwerken, en waar typische fouten ontstaan.

## 1. Overzicht van de stack

Jullie setup bestaat uit vier runtime-componenten en een netwerklaag:

- `client` (Vite-build, geserveerd via Nginx in container)
- `token-server` (Node/Express)
- `livekit` (SFU/signaling/media)
- `coturn` (STUN/TURN fallback)
- DNS + SSL + reverse proxy (Nginx Proxy Manager) + firewall/NAT op de VPS

## 2. Terminologie

### 2.1 WebRTC
Protocolstack voor realtime audio/video/data in de browser.

### 2.2 PeerConnection
De concrete WebRTC-verbinding. Fout `could not establish pc connection` betekent dat signaling lukte, maar media-pad niet.

### 2.3 ICE
Mechanisme dat meerdere netwerkpaden test en het werkende pad kiest.

### 2.4 Candidate types
- `host`: lokaal/direct adres
- `srflx`: publiek adres ontdekt via STUN
- `relay`: verkeer via TURN-relay

### 2.5 STUN
Helpt publieke adressen detecteren, maar relayt geen media.

### 2.6 TURN
Relaiserver die media doorstuurt wanneer direct pad faalt.

### 2.7 SFU
Selective Forwarding Unit: server ontvangt media van de host en verdeelt die naar viewers.

## 3. Rol van LiveKit

LiveKit is in jullie stack:

- signaling endpoint (`wss://...`)
- room/participant management
- media-router (SFU)

Belangrijke poorten:

- `7880/tcp` (HTTP/WebSocket signaling)
- `7881/udp` + `7881/tcp` (media/ICE)

## 4. Rol van Coturn

Coturn levert:

- STUN op `3478`
- TURN relay op `3478` + relay-range (`49160-49200/udp`)

Wanneer directe candidates geen verbinding maken, kiest ICE een `relay` candidate via TURN.

## 5. Rol van token-server

De browser krijgt geen API secret. In plaats daarvan:

1. Browser vraagt token bij `/token`
2. Token-server tekent JWT met `LIVEKIT_API_KEY` + `LIVEKIT_API_SECRET`
3. Browser gebruikt token om bij LiveKit room te joinen

Zo blijven secrets server-side.

## 6. Docker en Compose

Compose brengt alle services als één stack op:

- netwerken
- poortmappings
- env injectie
- startvolgorde

Belangrijk detail in jullie project:

- `VITE_*` variabelen worden in de client **tijdens build** ingebakken.
- Wijzig je `VITE_*`, dan is `docker compose ... --build client` verplicht.

## 7. VPS en Hostinger-context

Een VPS is de host waarop containers draaien. Bij providers zoals Hostinger gelden typisch:

- provider firewall/security rules
- OS firewall (bv. UFW)
- eventuele NAT/netwerkfilters

Voor WebRTC is dat belangrijk omdat media vaak via UDP loopt.

## 8. Nginx Proxy Manager in deze architectuur

NPM proxyt HTTP(S)/WebSocket-domeinen, bijvoorbeeld:

- `portal.*` → `livekit-client:80`
- `stream-api.*` → `livekit-token-server:3001`
- `stream.*` → `livekit-server:7880` (WebSocket enabled)

Wat NPM **niet** doet:

- TURN relayen
- WebRTC UDP media proxyen

Daarom moeten TURN- en media-poorten direct open staan op de VPS/firewall.

## 9. DNS en domeinen

Gebruik aparte subdomeinen per functie:

- portal/client
- api/token
- livekit signaling
- turn

Dat houdt routing, certs en troubleshooting duidelijk.

## 10. Config-lagen en prioriteit

### 10.1 Root `.env`
Wordt door Compose gebruikt voor container env + client build args.

### 10.2 `client/.env`
Alleen voor losse client-build buiten Compose.

### 10.3 `livekit.yaml`
Serverruntimeconfig van LiveKit. In productie hoort `rtc.use_external_ip: true` aan te staan.

## 11. Waarom signaling soms werkt terwijl media faalt

Signaling:

- HTTPS/WSS over TCP
- gaat meestal door firewalls heen

Media:

- ICE checks via UDP/TCP candidates
- kan geblokkeerd worden

Gevolg: token + websocket lijken oké, maar call blijft hangen op PC/ICE.

## 12. TURN fallback strategie

Praktisch robuuste instelling:

- STUN URL ingesteld
- TURN URL met zowel UDP als TCP transport

Voorbeeldpatroon:

- `turn:...:3478?transport=udp,turn:...:3478?transport=tcp`

Diagnosemodus:

- `VITE_ICE_TRANSPORT_POLICY=relay`

Als relay wel werkt en `all` niet, dan zit de bottleneck in direct pad/firewall/NAT.

## 13. Observability en logs

Handige bronnen:

- browserconsole (client debug)
- `about:webrtc` (candidate types, selected pair)
- `docker compose logs -f livekit`
- `docker compose logs -f coturn`

Als je geen `relay` candidates ziet terwijl TURN ingesteld is, draait vaak nog een oude frontend build of TURN is niet bereikbaar.

## 14. Meest voorkomende fouten

1. Oude frontend bundle na env-wijziging
2. TURN variabelen wel in `.env`, maar geen rebuild gedaan
3. TURN poorten niet open in firewall
4. Verkeerde LiveKit candidate advertentie (bv. vroeger fout `node_ip`)
5. Alleen NPM ingesteld, maar geen directe TURN/media poorten geopend

## 15. Minimale operationele checklist

- [ ] `livekit.yaml` met `use_external_ip: true`
- [ ] `coturn` service draait
- [ ] `VITE_TURN_URL` bevat UDP + TCP variant
- [ ] client opnieuw gebouwd na `VITE_*` wijziging
- [ ] 3 proxy hosts in NPM (client/api/livekit)
- [ ] `7881`, `3478`, `49160-49200` open op firewall
- [ ] browser toont TURN in ICE-config en bij voorkeur `relay` candidates

## 16. Relatie met de project README

Gebruik de hoofd-README voor operationele stappen en command snippets.
Gebruik dit document voor context en achtergrond bij keuzes in de architectuur.
