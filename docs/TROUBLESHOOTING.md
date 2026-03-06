# Troubleshooting

## 1. Token ophalen lukt, maar video blijft zwart

Dit is een klassiek symptoom van een probleem in het mediapad.

Mogelijke oorzaken:

- TURN niet bereikbaar,
- ICE faalt,
- UDP-poorten staan niet open,
- verkeerde LiveKit of TURN URL,
- oude frontend build gebruikt oude config.

Controleer:

- `VITE_LIVEKIT_URL`
- `VITE_TURN_URL`
- `VITE_TURN_USERNAME`
- `VITE_TURN_PASSWORD`
- open poorten voor LiveKit en Coturn
- of de client opnieuw gebouwd werd

---

## 2. Signaling werkt wel, media niet

Als room joinen lukt maar audio/video niet, dan werkt waarschijnlijk:

- token-server,
- LiveKit signaling,
- basisverbinding.

Maar niet:

- ICE candidate selectie,
- direct pad,
- TURN fallback,
- firewall/netwerk.

Dat verschil is cruciaal:

- **signaling** = sessie-opzet,
- **media** = effectieve audio/video.

---

## 3. Ik heb `.env` aangepast, maar er verandert niets

Waarschijnlijk gaat het om `VITE_*` variabelen.

Die zijn build-time. Dat betekent:

- variabele aanpassen,
- client opnieuw builden,
- pas dan zie je effect.

Alleen `docker compose restart` is dan meestal niet genoeg.

---

## 4. TURN staat geconfigureerd, maar relay lijkt niet gebruikt te worden

Mogelijke oorzaken:

- foutieve TURN URL,
- verkeerde credentials,
- relay-poorten niet open,
- oude frontend bundle,
- Coturn draait niet goed.

Controleer browserdebug, serverlogs en containerstatus.

---

## 5. CORS-fout bij token ophalen

De token-server laat momenteel alle origins toe, maar wanneer je dat strenger maakt, moet `FRONTEND_ORIGINS` correct ingesteld zijn.

Controleer of de frontend-origin exact overeenkomt met wat de server verwacht.

---

## 6. WebSocket connectie naar LiveKit faalt

Controleer:

- klopt `VITE_LIVEKIT_URL`,
- is het `ws://` of `wss://` in de juiste context,
- draait LiveKit effectief,
- staat poort `7880` open,
- is reverse proxy correct ingesteld voor WebSockets.

---

## 7. Host kan geen camera of microfoon starten

Controleer:

- browserrechten voor camera/microfoon,
- of de browser in een toegelaten context draait,
- of er geen apparaatconflict is,
- of de hostcode effectief `createLocalTracks({ audio: true, video: true })` bereikt.

---

## 8. Viewer verbindt, maar krijgt geen track

Mogelijke oorzaken:

- host publiceert nog niet,
- host zit in andere room,
- viewer zit in andere room,
- track event wordt niet bereikt,
- media wordt niet afgeleverd door connectiviteitsprobleem.

Controleer altijd of host en viewer exact dezelfde roomnaam gebruiken.

---

## 9. Debug-output in `watch.js` lijkt vreemd

In de huidige repo geeft `getIceEnvDebug()` de velden `stunUrls` en `turnUrls` terug, terwijl `watch.js` logt met `startupIceEnv.stunUrl` en `startupIceEnv.turnUrl`.

Dat zorgt voor misleidende debugoutput. De applicatie hoeft daardoor niet te crashen, maar het maakt troubleshooting verwarrender.

---

## 10. Belangrijke logbronnen

Gebruik bij problemen:

- browser console,
- netwerkrequests in devtools,
- `docker compose logs -f token-server`,
- `docker compose logs -f livekit`,
- `docker compose logs -f coturn`.

Die combinatie geeft meestal het snelst inzicht in waar het probleem zit.

---

## 11. Checklist voor een werkende setup

- LiveKit draait
- token-server draait
- Coturn draait
- juiste `.env` waarden zijn ingevuld
- client is herbuild na `VITE_*` wijzigingen
- relevante poorten staan open
- host en viewer gebruiken dezelfde room
- browser heeft camera/microfoonrechten
- DNS en SSL zijn correct wanneer productie-URLs gebruikt worden

---

## 12. Wanneer is een probleem waarschijnlijk infrastructuur en niet code?

Verdacht infrastructuurprobleem:

- alles lijkt lokaal te werken maar niet extern,
- signaling werkt maar media niet,
- TURN lijkt genegeerd te worden,
- bepaalde netwerken werken wel en andere niet.

Dan ligt het vaak aan:

- firewall,
- NAT,
- poorten,
- domeinconfig,
- reverse proxy,
- TURN bereikbaarheid.
