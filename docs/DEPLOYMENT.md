# Deploymentgids

## 1. Waarom deployment hier belangrijk is

Deze applicatie draait niet uit één enkel proces. Je hebt meerdere services die met elkaar moeten communiceren:

- client
- token-server
- LiveKit
- Coturn

Dat betekent dat deployment niet alleen draait om “de site online zetten”, maar ook om:

- configuratie,
- poorten,
- domeinen,
- SSL,
- firewallregels,
- container-orkestratie.

---

## 2. Minimale vereisten

Je hebt idealiter nodig:

- een **VPS**,
- Docker,
- Docker Compose,
- domeinen of subdomeinen,
- open firewallpoorten,
- SSL-certificaten voor HTTP/WSS endpoints.

---

## 3. Belangrijke poorten

### LiveKit
- `7880/tcp` → HTTP/WebSocket signaling
- `7881/udp` → media/ICE
- `7881/tcp` → extra fallback/connectiviteit

### Coturn
- `3478/tcp` → STUN/TURN
- `3478/udp` → STUN/TURN
- `49160-49200/udp` → TURN relay range

### Token-server
- `3001/tcp`

### Client
- container serveert standaard HTTP via poort `80` intern; extern kan dat via mapping of reverse proxy verlopen

---

## 4. Waarom een reverse proxy niet genoeg is

Een reverse proxy zoals Nginx of Nginx Proxy Manager helpt met:

- domeinrouting,
- SSL,
- HTTP-proxying,
- WebSockets.

Maar realtime media heeft ook UDP-verkeer en TURN relay nodig. Dat betekent:

- LiveKit media-poorten moeten rechtstreeks openstaan,
- Coturn-poorten moeten rechtstreeks openstaan,
- enkel reverse proxy instellen is onvoldoende.

---

## 5. Environment variabelen en configuratie

### Root `.env`
Wordt gebruikt door Docker Compose voor:

- server-side environment variables,
- build args voor de client.

Belangrijkste waarden:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `FRONTEND_ORIGINS`
- `VITE_TOKEN_URL`
- `VITE_LIVEKIT_URL`
- `VITE_STUN_URL`
- `VITE_TURN_URL`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`
- `TURN_REALM`
- `TURN_USERNAME`
- `TURN_PASSWORD`

### `client/.env`
Wordt gebruikt wanneer je de client los buildt buiten Docker Compose.

### `livekit.yaml`
Bevat serverconfig voor LiveKit.

Belangrijk in productie:

- `rtc.use_external_ip: true`

---

## 6. Build-time versus runtime

Een heel belangrijk deploymentconcept in deze repo:

### Frontend (`VITE_*`)
Is **build-time configuratie**.

Dat betekent:

- wijzig je een `VITE_*` variabele,
- dan moet je de client opnieuw builden.

Alleen containers herstarten is dan niet genoeg.

### Backend (`process.env`)
Is runtime configuratie.

Dat betekent:

- een `.env` wijziging voor de server kan vaak werken met herstart van die service,
- maar de frontend heeft opnieuw build nodig.

---

## 7. Typische productie-opstelling met subdomeinen

Een logische indeling is:

- `portal.jouwdomein.com` → client
- `api.jouwdomein.com` → token-server
- `livekit.jouwdomein.com` → LiveKit signaling
- `turn.jouwdomein.com` → TURN/STUN endpoint

Dat houdt de architectuur duidelijk en maakt certificaatbeheer eenvoudiger.

---

## 8. Docker Compose rol

`docker-compose.yml` orkestreert de stack en maakt deployment reproduceerbaar.

Compose regelt:

- images bouwen,
- containers starten,
- netwerken aanmaken,
- poorten mappen,
- services herstarten,
- environment variables injecteren.

Voor een onderwijsproject is dat zeer nuttig, omdat het de infrastructuur expliciet maakt.

---

## 9. Stappenplan op hoog niveau

1. Voorzie een VPS.
2. Installeer Docker en Docker Compose.
3. Configureer `.env`.
4. Maak `livekit.yaml` aan op basis van het voorbeeld.
5. Controleer firewallpoorten.
6. Start Compose-services.
7. Configureer DNS.
8. Stel SSL in voor frontend/API/signaling.
9. Herbuild de client wanneer `VITE_*` wijzigt.
10. Test host- en viewerflow vanop verschillende netwerken.

---

## 10. Specifieke aandacht voor TURN

TURN faalt vaak niet door code, maar door infrastructuurproblemen.

Controleer daarom altijd:

- draait Coturn effectief,
- zijn de poorten open,
- gebruikt de client de juiste TURN URL,
- zijn username en wachtwoord correct,
- is de client herbuild na configwijzigingen.

Wanneer signaling wel werkt maar media niet, is TURN/ICE/firewall een van de eerste verdachte zones.

---

## 11. Externe client hosting

Deze repo ondersteunt ook het los hosten van de frontend.

Bijvoorbeeld:

- frontend op GitHub Pages,
- backend/LiveKit/Coturn op een VPS.

In dat geval moet je goed opletten met:

- `VITE_TOKEN_URL`
- `VITE_LIVEKIT_URL`
- `FRONTEND_ORIGINS`
- CORS-configuratie

Dat is handig voor flexibiliteit, maar verhoogt ook de configuratiecomplexiteit.

---

## 12. Productierijp versus demo-opstelling

Deze repo is een goede demo-architectuur, maar nog geen volledig afgewerkt productieplatform.

Wat nog ontbreekt voor een production-grade versie:

- echte gebruikersauthenticatie,
- restrictiever CORS-beleid,
- rate limiting,
- monitoring,
- loggingstrategie,
- hardening van secrets en netwerktoegang,
- eventueel database-integratie.

Dat is niet negatief: het maakt juist duidelijk waar de grens ligt tussen een leerproject en een volwaardig product.
