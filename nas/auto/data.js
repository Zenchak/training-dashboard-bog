window.AUTO_FAMILY_DATA = {
  updated: "2026-10-15",
  cars: [
    {
      id: "kia-rio",
      owner: "Bogdan",
      name: "Kia Rio",
      subtitle: "2013 · 1.2 benzina G4LA · 1.248 cc",
      plateMasked: "ES•••YH",
      currentKm: 256846,
      kmLabel: "chilometraggio registrato il 15/10/2026",
      status: "In uso · tagliando appena eseguito",
      statusTone: "ok",
      situation: [
        "Tagliando completo eseguito il 15/10/2026 a 256.846 km.",
        "Catena di distribuzione originale: preventivo ricevuto e intervento da valutare separatamente.",
        "Priorità: manutenzione preventiva, affidabilità ad alto chilometraggio e costi sotto controllo."
      ],
      next: [
        {title:"Catena di distribuzione", detail:"Verificare il preventivo e decidere la sostituzione in base a rumore/gioco e valutazione dell’officina.", tone:"attention"},
        {title:"Controllo livelli", detail:"Continuare a tenere sotto controllo consumo olio e circuito di raffreddamento.", tone:"normal"}
      ],
      estimates: [
        {
          date:"2026-10-15",
          title:"Sostituzione catena di distribuzione",
          shop:"Preventivo ricevuto",
          amount:null,
          status:"Da valutare",
          note:"Documento mostrato separatamente; importo e dettaglio voci non ancora registrati nel database."
        }
      ],
      maintenance: [
        {date:"2026-10-15", km:256846, shop:"Autofficina Signorelli", amount:379.75, work:["Olio motore 3,5 L","Filtro olio","Filtro aria","Filtro abitacolo","4 candele","Rabbocchi e livelli","2 h manodopera"], note:"Totale stimato IVA inclusa dal resoconto: 379,75 €."},
        {date:"2026-06-04", km:248900, shop:"", amount:null, work:["Rabbocco olio 10W-40"], note:"Rabbocco registrato."},
        {date:"2025-08-27", km:null, shop:"Guru Motors", amount:590, work:["Olio e filtri","Pastiglie freno","Climatizzatore","Batteria","Biellette"], note:"Chilometraggio non registrato."},
        {date:"2025-03-25", km:221666, shop:"Guru Motors", amount:140, work:["Filtri","Controllo pastiglie / pressione","Lampadina H7"], note:""},
        {date:"2024-08-07", km:210000, shop:"Guru Motors", amount:130, work:["Olio e filtri","Controlli generali"], note:""},
        {date:"2024-05-25", km:205500, shop:"Zambelli", amount:null, work:["Frizione","Candele"], note:"Costo non registrato."},
        {date:"2024-01-16", km:199600, shop:"PS Autoservice", amount:220, work:["Olio e filtro olio","Pompa tergicristalli"], note:""},
        {date:"2023-11-22", km:195389, shop:"Zambelli", amount:25, work:["Cambio gomme"], note:""},
        {date:"2023-06-28", km:185147, shop:"PS Autoservice", amount:180, work:["Olio motore","Filtro olio","Filtro aria","Filtro abitacolo"], note:""}
      ]
    },
    {
      id: "fiat-punto",
      owner: "Camilla",
      name: "Fiat Punto",
      subtitle: "Auto di Camilla",
      plateMasked: "DJ•••CC",
      currentKm: 113110,
      kmLabel: "ultimo chilometraggio registrato il 02/02/2026",
      status: "Storico da aggiornare",
      statusTone: "neutral",
      situation: [
        "Ultimo intervento registrato il 02/02/2026 a 113.110 km.",
        "Manca il chilometraggio attuale: sarà il primo dato da aggiornare al prossimo controllo.",
        "Storico mantenuto separato dalla Kia Rio."
      ],
      next: [
        {title:"Aggiorna chilometraggio", detail:"Registrare il km attuale al prossimo utilizzo/intervento.", tone:"normal"},
        {title:"Tagliando ordinario", detail:"Valutare olio e filtri in base a tempo e chilometri dall’ultimo tagliando noto.", tone:"normal"}
      ],
      estimates: [],
      maintenance: [
        {date:"2026-02-02", km:113110, shop:"Guru Motors", amount:130, work:["Intervento finestrino (probabile)"], note:"La descrizione dell’intervento non era certa al 100%."},
        {date:"2024-08-07", km:100850, shop:"Monti Officina", amount:150, work:["Ricarica climatizzatore","Sistemazione selettore A/C"], note:""},
        {date:"2024-01-10", km:96514, shop:"PS Autoservice", amount:150, work:["Olio","Filtro olio","Giro gomme"], note:""}
      ]
    }
  ]
};