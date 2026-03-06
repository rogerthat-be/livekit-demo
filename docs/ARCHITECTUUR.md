# Architectuur van de LiveKit Streaming Demo

## 1. Architectuur op hoog niveau

Deze applicatie volgt een klassieke full-stack realtime architectuur:

- de **browser** toont de UI en capturet media,
- de **token-server** levert beveiligde toegangstokens,
- de **LiveKit server** beheert rooms en media-routing,
- de **Coturn server** helpt bij moeilijke netwerkverbindingen,
- en **Docker Compose** brengt alles samen in één stack.

Je kunt dit zien als een keten van verantwoordelijkheden:

1. **Frontend**: user interface en browserlogica
2. **Token-server**: beveiliging en toegangscontrole
3. **LiveKit**: realtime room- en media-management
4. **Coturn**: fallback voor connectiviteit
5. **Deploymentlaag**: server, netwerken, poorten, reverse proxy

---

## 2. Waarom deze opsplitsing nodig is

Een live streaming applicatie is niet gewoon “een video op een pagina zetten”. Zodra gebruikers audio en video live willen uitwisselen, moeten meerdere problemen tegelijk opgelost worden:

- hoe browsers elkaar vinden,
- hoe je veilige toegangscontrole doet,
- hoe video/audio met lage vertraging verstuurd wordt,
- hoe je omgaat met firewalls en NAT,
- en hoe je alles betrouwbaar online host.

Daarom is de architectuur opgesplitst in gespecialiseerde onderdelen.

---

## 3. Component per component

### 3.1 Frontend (`client/`)

De frontend is verantwoordelijk voor:

- het tonen van de UI,
- input van de roomnaam,
- opvragen van tokens,
- verbinden met LiveKit,
- publiceren van lokale tracks,
- ontvangen van remote tracks.

#### Belangrijke bestanden

- `client/host.html`
- `client/watch.html`
- `client/src/host.js`
- `client/src/watch.js`
- `client/src/lib/livekit.js`

#### Hostpagina
De host gebruikt `host.js`. Daar gebeurt:

- token ophalen als `host`,
- verbinden met de room,
- camera en microfoon activeren,
- lokale tracks publiceren,
- lokale video renderen.

#### Viewerpagina
De viewer gebruikt `watch.js`. Daar gebeurt:

- token ophalen als `viewer`,
- verbinden met de room,
- wachten op remote tracks,
- remote video tonen.

#### Helperlaag
`client/src/lib/livekit.js` centraliseert:

- `wsUrl`
- `tokenUrl`
- STUN/TURN config
- `fetchToken()`
- `createRoomOptions()`
- debugfuncties

Dat maakt de frontendlogica duidelijker en vermijdt duplicatie.

---

### 3.2 Token-server (`server/token-server.js`)

De token-server is een Express-app met één hoofdtaak: **veilige tokens genereren**.

De browser stuurt een request naar `/token` met queryparameters zoals:

- `room`
- `identity`
- `role`

De server leest:

- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

uit de environment en maakt vervolgens een `AccessToken`.

Belangrijke grant-logica in deze repo:

- `roomJoin: true`
- `room: <gekozen room>`
- `canPublish: role === 'host'`
- `canSubscribe: true`

Dat betekent:

- een host mag publishen én subscriben,
- een viewer mag joinen en subscriben, maar niet publishen.

Dit is een eenvoudig maar goed voorbeeld van **rolgebaseerde toegangscontrole**.

---

### 3.3 LiveKit server

LiveKit is het realtime hart van de applicatie.

Het beheert:

- signaling,
- room lifecycle,
- participants,
- track publishing,
- track subscription,
- media forwarding.

Belangrijke rol van LiveKit in deze repo:

- de host publiceert audio/video naar LiveKit,
- viewers subscriben op die tracks,
- LiveKit stuurt de media door.

LiveKit werkt hier als een **SFU (Selective Forwarding Unit)**.

#### Wat betekent SFU concreet?

Bij een SFU stuurt de host zijn stream **één keer** naar de server. Daarna verdeelt de server die stream naar alle viewers.

Voordeel:

- minder belasting op de host,
- schaalbaarder dan pure peer-to-peer,
- eenvoudiger beheer van meerdere deelnemers.

Belangrijke LiveKit poorten in deze repo:

- `7880/tcp` → HTTP/WebSocket signaling
- `7881/udp` → media en connectiviteit
- `7881/tcp` → extra fallback/connectiviteit

---

### 3.4 Coturn

Coturn is een open source implementatie van een **STUN/TURN server**.

Deze service is er omdat WebRTC-verbindingen in echte netwerken vaak mislukken zonder hulp.

#### STUN
STUN helpt een client te ontdekken hoe die aan de buitenkant van het netwerk zichtbaar is.

#### TURN
TURN werkt als relay-server. Wanneer een directe verbinding niet lukt, kan audio/video via TURN verstuurd worden.

In deze repo is Coturn dus geen overbodige extra, maar een belangrijk infrastructuuronderdeel.

Zonder TURN kan het gebeuren dat:

- token ophalen lukt,
- room joinen lukt,
- websocket signaling werkt,
- maar media niet doorkomt.

Dat is precies het soort probleem waarvoor TURN bedoeld is.

Belangrijke poorten:

- `3478/tcp`
- `3478/udp`
- `49160-49200/udp` voor relayverkeer

---

### 3.5 Docker Compose

`docker-compose.yml` definieert alle services in één bestand.

In deze repo start Compose onder andere:

- `livekit`
- `coturn`
- `token-server`
- `client`

Compose regelt:

- poortmappings,
- netwerken,
- environment variables,
- build args,
- afhankelijkheden,
- restart policy.

Dit maakt de setup reproduceerbaar en veel eenvoudiger dan alles handmatig starten.

---

## 4. Verbindingsflow van host naar viewer

### 4.1 Hostflow

1. Host opent `host.html`
2. Host kiest een room
3. Frontend vraagt token op bij `/token`
4. Token-server genereert JWT
5. Host verbindt met LiveKit
6. Browser activeert camera en microfoon
7. Tracks worden gepubliceerd
8. Lokale videotrack wordt getoond

### 4.2 Viewerflow

1. Viewer opent `watch.html`
2. Viewer kiest dezelfde room
3. Frontend vraagt token op
4. Token-server levert JWT
5. Viewer verbindt met LiveKit
6. Viewer ontvangt `trackSubscribed`
7. Remote videotrack wordt getoond

---

## 5. Waarom directe browser-tot-browser streaming niet volstaat

Bij kleine demo’s lijkt het soms alsof browsers rechtstreeks met elkaar kunnen praten. Maar in echte situaties is dat moeilijker door:

- NAT,
- firewalls,
- meerdere deelnemers,
- netwerkrestricties,
- schaalbaarheid.

Een LiveKit-gebaseerde architectuur lost dat op door centrale coördinatie en forwarding.

---

## 6. Signaling versus media

Een belangrijk concept in realtime apps is het onderscheid tussen:

### Signaling
Gebruikt voor:

- room join,
- deelnemersinformatie,
- uitwisseling van verbindingsdata,
- sessie-opzet.

Dit verloopt typisch via HTTP/WebSocket.

### Media
Gebruikt voor:

- effectieve audio/video transport.

Dit verloopt via WebRTC en gebruikt vaak UDP.

### Waarom is dit onderscheid belangrijk?
Omdat signaling vaak prima werkt, terwijl media toch faalt. Dan lijkt het alsof “de app bijna werkt”, maar in werkelijkheid zit het probleem in ICE/TURN/firewall/netwerk.

---

## 7. Beveiligingsarchitectuur

Een sterk punt van deze repo is dat secrets niet in de browser staan.

### Veilig patroon

- frontend vraagt een token aan,
- backend genereert token,
- LiveKit vertrouwt alleen ondertekende tokens.

### Waarom goed?

- API secret blijft verborgen,
- rechten zijn centraal af te dwingen,
- latere uitbreiding met auth is mogelijk,
- de backend blijft de bron van waarheid.

### Huidige beperking
De repo is nog een demo-opstelling. Momenteel:

- CORS staat open,
- iedereen die het endpoint bereikt kan een token aanvragen,
- er is nog geen login of database.

Dat maakt de architectuur didactisch duidelijk, maar nog niet volledig productierijp.

---

## 8. Netwerkarchitectuur op een VPS

Op een VPS moeten meerdere soorten verkeer toegestaan worden:

- HTTP voor de client,
- HTTP/API voor de token-server,
- WebSocket signaling voor LiveKit,
- UDP/TCP voor media,
- UDP/TCP voor TURN/STUN.

Dit verklaart waarom een reverse proxy alleen niet genoeg is.

### Reverse proxy doet vooral
- domeinrouting,
- SSL terminatie,
- HTTP/WebSocket proxying.

### Reverse proxy doet niet automatisch
- TURN relayverkeer,
- WebRTC UDP media proxyen.

Daarom moeten belangrijke poorten rechtstreeks open staan op server en firewall.

---

## 9. Samenvatting van de architectuur

Deze applicatie werkt omdat elk onderdeel één duidelijke taak heeft:

- **Frontend**: UI en browserinteractie
- **Token-server**: veilige toegang en grants
- **LiveKit**: rooms, signaling en media-routing
- **Coturn**: connectiviteitsfallback via STUN/TURN
- **Docker Compose**: orkestratie en deployment
- **VPS**: hostomgeving voor de volledige stack

Samen vormt dit een compacte maar realistische streamingarchitectuur waarmee studenten zowel frontend, backend, realtime media als infrastructuur leren begrijpen.
