# Prova Synology NAS

Questo stack serve i tre progetti dal NAS e li sincronizza automaticamente da GitHub ogni 60 secondi.

Porte locali:
- 8081 = Training dashboard
- 8082 = Mappa gare
- 8083 = Cerco Casa

## Avvio su Synology Container Manager
1. Crea una cartella, ad esempio `/volume1/docker/bogdan-sites`.
2. Copia in quella cartella `docker-compose.yml` e `nginx.conf`.
3. Apri Container Manager > Progetto > Crea.
4. Scegli la cartella e usa il file `docker-compose.yml`.
5. Avvia il progetto.
6. Dal browser nella rete di casa apri `http://IP_DEL_NAS:8081`, `:8082` e `:8083`.

L'updater esegue un controllo GitHub ogni 60 secondi. Per la dashboard training esegue anche `build.js` dopo ogni sincronizzazione.

Nota: in questa prima prova Cerco Casa continua a usare l'API note e la pagina di conferma del sito Netlify esistente, ma non richiede nuovi deploy Netlify. La mappa gare usa ancora il contenuto storico incorporato nel progetto finché non viene migrato completamente.
