# Volledige tech stack uitgelegd

Dit document legt elke technologie uit die in deze repo gebruikt wordt of rechtstreeks relevant is voor de werking ervan.

---

## 1. HTML

De browserpagina’s `host.html` en `watch.html` vormen de gebruikersinterface.

HTML is hier verantwoordelijk voor:

- formulieren,
- knoppen,
- video-elementen,
- basisstructuur van de pagina.

Deze repo gebruikt bewust geen zware frontend frameworklaag, zodat de focus ligt op de streaminglogica zelf.

---

## 2. Vanilla JavaScript

De clientlogica is geschreven in gewone JavaScript modules.

Dat is didactisch interessant, omdat studenten rechtstreeks zien hoe:

- event handlers werken,
- tokens opgehaald worden,
- LiveKit rooms aangemaakt worden,
- tracks gepubliceerd en getoond worden.

Belangrijke bestanden:

- `client/src/host.js`
- `client/src/watch.js`
- `client/src/lib/livekit.js`

---

## 3. Vite

**Vite** is de build tool van de frontend.

In deze repo wordt Vite gebruikt om:

- JavaScript modules te bundelen,
- environment variables met prefix `VITE_` in te lezen,
- een productie-build te genereren,
- lokaal te developen met een dev server.

### Waarom belangrijk?
Omdat `VITE_*` variabelen **build-time** zijn. Dat betekent dat wijzigingen pas zichtbaar zijn nadat de client opnieuw gebouwd is.

Voorbeelden:

- `VITE_TOKEN_URL`
- `VITE_LIVEKIT_URL`
- `VITE_STUN_URL`
- `VITE_TURN_URL`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`

---

## 4. livekit-client

De dependency `livekit-client` is de browser-SDK van LiveKit.

Deze library helpt om:

- een room aan te maken,
- te verbinden met LiveKit,
- lokale tracks te maken,
- tracks te publiceren,
- remote tracks te ontvangen,
- events af te handelen.

Zonder deze SDK zou je veel meer laag-niveau WebRTC-code zelf moeten schrijven.

In deze repo zie je typische SDK-acties zoals:

- `new Room(...)`
- `room.connect(...)`
- `createLocalTracks(...)`
- `room.on('trackSubscribed', ...)`

---

## 5. Node.js

**Node.js** is een JavaScript runtime voor de serverkant.

Hiermee kan dezelfde programmeertaal gebruikt worden voor:

- frontendlogica,
- backendlogica.

In deze repo draait Node.js de token-server.

---

## 6. Express

**Express** is een minimalistisch framework voor Node.js om HTTP-servers en API’s te bouwen.

De token-server gebruikt Express voor:

- het definiëren van de route `/token`,
- het lezen van queryparameters,
- het terugsturen van JSON,
- luisteren op poort `3001`.

Deze repo toont dus een heel typische Express use case: een kleine, duidelijke API-service.

---

## 7. dotenv

`dotenv` laadt variabelen uit een `.env` bestand in `process.env`.

Dat is belangrijk om gevoelige of omgeving-afhankelijke config niet hardcoded in code te zetten.

Voorbeelden:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `FRONTEND_ORIGINS`

---

## 8. cors

De `cors` package laat een server bepalen welke origins de API mogen aanroepen.

In deze repo staat CORS momenteel open voor alle origins:

```js
app.use(cors({ origin: '*' }))
```

Voor een demo is dat praktisch, maar in productie wil je dit meestal beperken tot bekende frontend domeinen.

---

## 9. livekit-server-sdk

De `livekit-server-sdk` wordt gebruikt door de token-server om veilige toegangstokens te maken.

Belangrijk object:

- `AccessToken`

Daarmee genereert de backend een JWT met room- en permissie-informatie.

Deze SDK is essentieel, omdat de browser zelf nooit met de server secret mag signeren.

---

## 10. JWT

**JWT** betekent **JSON Web Token**.

Een JWT is een digitaal ondertekend token dat informatie bevat over:

- identiteit,
- roomtoegang,
- permissies.

LiveKit vertrouwt die tokens omdat ze ondertekend zijn met de geheime sleutel van de backend.

In deze repo bepaalt de JWT onder andere of iemand:

- de room mag joinen,
- mag publishen,
- mag subscriben.

---

## 11. WebRTC

**WebRTC** is de kerntechnologie achter realtime audio, video en datacommunicatie in browsers.

Ook al gebruik je LiveKit, uiteindelijk draait de mediaoverdracht nog steeds op WebRTC.

WebRTC regelt onder andere:

- capture van camera en microfoon,
- codec-onderhandeling,
- netwerkverbindingen,
- audio/video transport.

WebRTC is krachtig, maar ook complex. Daarom is een platform als LiveKit zo nuttig.

---

## 12. ICE

**ICE** staat voor **Interactive Connectivity Establishment**.

ICE is het mechanisme dat verschillende mogelijke netwerkpaden verzamelt en test om te bepalen welke verbinding werkt.

Het combineert informatie uit:

- lokale candidates,
- STUN-discovery,
- TURN relay.

Waarom belangrijk? Omdat een toestel achter een router of firewall niet zomaar rechtstreeks bereikbaar is.

---

## 13. STUN

**STUN** helpt een client te ontdekken hoe hij zichtbaar is voor de buitenwereld.

Het antwoord op de vraag is in essentie:

> “Welk publiek netwerkadres ziet een externe server voor mij?”

STUN helpt connectiviteit, maar relayt zelf geen media.

In deze repo kan STUN geconfigureerd worden via `VITE_STUN_URL`.

---

## 14. TURN

**TURN** is een relaymechanisme voor WebRTC.

Wanneer een directe verbinding niet lukt, kan media via een TURN server lopen.

Dat is vooral belangrijk bij:

- strenge firewalls,
- bedrijfsnetwerken,
- mobiele netwerken,
- moeilijke NAT-situaties.

TURN is vaak het verschil tussen:

- “de app werkt soms”,
- en “de app werkt betrouwbaar in echte omstandigheden”.

---

## 15. Coturn

**Coturn** is een populaire open source implementatie van een STUN/TURN server.

In deze repo levert Coturn:

- STUN op poort `3478`,
- TURN op poort `3478`,
- relay via een UDP-poortrange.

Coturn maakt de stack robuuster en realistischer.

---

## 16. LiveKit

**LiveKit** is een open source platform voor realtime communicatie.

In deze repo doet LiveKit drie dingen:

- signaling,
- room/participant management,
- media forwarding.

LiveKit werkt hier als **SFU**.

### Wat is een SFU?
**Selective Forwarding Unit** betekent dat de server binnenkomende media selectief doorstuurt naar andere deelnemers.

Voordeel:

- efficiënter dan pure peer-to-peer,
- schaalbaar,
- geschikt voor meerdere kijkers.

---

## 17. Docker

**Docker** laat software draaien in containers.

Een container bevat:

- code,
- dependencies,
- runtimeomgeving,
- configuratie.

Waarom nuttig in deze repo?

Omdat je meerdere services hebt met verschillende rollen. Docker maakt die setup consistenter en reproduceerbaar.

---

## 18. Docker Compose

**Docker Compose** laat je meerdere containers samen beheren in één bestand.

In `docker-compose.yml` definieer je:

- welke services bestaan,
- welke poorten openstaan,
- welke environment variables meegaan,
- welke netwerken gebruikt worden,
- welke containers samen starten.

Dat maakt deze multi-service applicatie hanteerbaar.

---

## 19. Nginx

**Nginx** is een webserver en reverse proxy.

In de `client` container wordt de Vite-build geserveerd via Nginx. Dat is een typische productie-opstelling voor statische frontend assets.

---

## 20. Nginx Proxy Manager

**Nginx Proxy Manager** is een gebruiksvriendelijke tool om reverse proxies en SSL-certificaten te beheren.

In een productie-opstelling kun je subdomeinen gebruiken zoals:

- frontend / portal,
- token API,
- LiveKit signaling.

Belangrijke nuance:

Nginx Proxy Manager kan HTTP(S) en WebSockets proxiëren, maar het vervangt niet automatisch alle WebRTC- of TURN-poorten. UDP-media en TURN-relay vereisen meestal nog altijd directe poorttoegang.

---

## 21. VPS

Een **VPS** is een **Virtual Private Server**.

Dat is een virtuele machine die je huurt bij een provider en waarop je zelf software en services kunt draaien.

Voor deze stack is een VPS nuttig omdat je daar:

- Docker containers kunt draaien,
- backendprocessen kunt laten lopen,
- poorten kunt openzetten,
- domeinen kunt koppelen,
- SSL kunt configureren.

Dit project heeft infrastructuur nodig die verder gaat dan eenvoudige statische hosting.

---

## 22. DNS

**DNS** vertaalt domeinnamen naar IP-adressen.

In een nette productie-opstelling gebruik je aparte subdomeinen per functie. Dat maakt beheer en troubleshooting overzichtelijker.

---

## 23. SSL / HTTPS / WSS

Voor productie gebruik je typisch:

- `https://` voor de token API,
- `wss://` voor LiveKit signaling.

Dit is belangrijk voor:

- veiligheid,
- browsercompatibiliteit,
- betrouwbare media-apps.

Veel browserfeatures rond media werken beter of alleen in beveiligde contexten.

---

## 24. Samenvatting van de tech stack

### Frontendlaag
- HTML
- JavaScript
- Vite
- livekit-client
- Nginx

### Backendlaag
- Node.js
- Express
- dotenv
- cors
- livekit-server-sdk

### Realtime/media
- WebRTC
- LiveKit
- ICE
- STUN
- TURN
- Coturn
- SFU

### Infrastructuur/deployment
- Docker
- Docker Compose
- VPS
- DNS
- SSL
- eventueel Nginx Proxy Manager

Samen vormen deze technologieën een compacte, moderne realtime webapp-stack.
