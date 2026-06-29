'use strict';
// i18n-Daten (DE-Quelle + EN/FR/ES/IT/NL). Reine Daten + Helfer; node-sicher.

const LANGS = ['de', 'en', 'fr', 'es', 'it', 'nl'];
const LANG_NAMES = { de: 'Deutsch', en: 'English', fr: 'Français', es: 'Español', it: 'Italiano', nl: 'Nederlands' };
const LOCALES = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', nl: 'nl-NL' };

const MESSAGES = {
  "de": {
    "nav.measure": "Messen",
    "nav.wheel": "Laufrad",
    "nav.guide": "Ratgeber",
    "gauge.freq": "Frequenz",
    "gauge.listening": "Lauscht…",
    "gauge.tension": "Spannung",
    "hint.idle": "Tippe auf „Lauschen“ und zupfe dann die Speiche an.",
    "hint.start": "Speiche anzupfen … auf „Stoppen“ tippen, wenn der Ton steht.",
    "hint.micError": "Mikrofon-Zugriff nötig (HTTPS/localhost) oder nicht verfügbar.",
    "hint.stopped": "Messung gestoppt.",
    "hint.detected": "Ton erkannt. Wert kann übernommen werden.",
    "hint.aborted": "Messung abgebrochen.",
    "hint.noClear": "Kein klarer Ton erkannt.",
    "hint.autoListen": "Speiche {n} anzupfen … wird automatisch übernommen.",
    "btn.listen": "Lauschen",
    "btn.stop": "Stoppen",
    "unit.N": "N",
    "unit.kgf": "kp",
    "ctx.noWheel": "Kein Laufrad aktiv. Lege im Tab „Laufrad“ ein Laufrad an (Profil + freie Längen links/rechts) und wähle eine Speiche, um die Spannung zu berechnen und Messwerte zu übernehmen.",
    "ctx.activeWheel": "Aktives Laufrad",
    "ctx.wheel": "Laufrad",
    "ctx.profile": "Profil",
    "ctx.spoke": "Speiche",
    "ctx.freeLength": "Freie Länge",
    "ctx.noSpokeSelected": "Keine Speiche gewählt – im Laufrad-Tab antippen.",
    "ctx.editHint": "Profil & Längen änderst du im Laufrad-Tab.",
    "ctx.unit": "Einheit",
    "label.nr": "Nr.",
    "label.spokes": "Speichen",
    "btn.applyToSpoke": "Auf Speiche {n} übernehmen",
    "apply.needWheel": "Lege im Tab „Laufrad“ erst ein Laufrad an und wähle eine Speiche, um den Messwert zu übernehmen.",
    "toast.applied": "Auf Speiche {n} übernommen.",
    "create.title": "Neues Laufrad",
    "create.name": "Name",
    "create.defaultName": "Mein Laufrad",
    "create.fallbackName": "Laufrad",
    "create.position": "Position",
    "create.spokeCount": "Speichenzahl",
    "create.create": "Laufrad anlegen",
    "pos.front": "Vorderrad",
    "pos.rear": "Hinterrad",
    "side.left": "Links",
    "side.right": "Rechts",
    "btn.newWheel": "Neues Laufrad",
    "build.title": "Aufbau",
    "build.subtitle": "Speichenprofil und freie Längen dieses Laufrads.",
    "build.profile": "Speichenprofil",
    "build.freeLeft": "Freie Länge links",
    "build.freeRight": "Freie Länge rechts",
    "build.note": "Freie Schwinglänge = vom Nippelsitz bis zum Speichenbogen an der Nabe. Links/rechts können unterschiedlich sein (z. B. Hinterrad).",
    "legend.unmeasured": "ungemessen",
    "legend.inBand": "im Band",
    "legend.outBand": "außerhalb",
    "confirm.discardWheel": "Das aktuelle Laufrad inkl. aller Messwerte wird verworfen. Fortfahren?",
    "spoke.tapToSelect": "Tippe eine Speiche an, um sie auszuwählen.",
    "spoke.side": "Seite",
    "spoke.notMeasured": "Noch nicht gemessen. Im Tab „Messen“ messen.",
    "even.title": "Gleichmäßigkeit",
    "even.measured": "gemessen",
    "even.noData": "Noch keine Messwerte für diese Seite.",
    "stat.mean": "Mittel",
    "stat.min": "Min",
    "stat.max": "Max",
    "stat.spread": "Streuung",
    "even.band": "Im ±10%-Band",
    "even.footer": "Gleichmäßige Spannung pro Seite ist nicht automatisch zentriert.",
    "material.steel": "Stahl",
    "aria.wheel": "Laufrad mit {n} Speichen",
    "material.stainless": "Edelstahl",
    "material.aluminium": "Aluminium",
    "material.titanium": "Titan",
    "material.carbon": "Carbon",
    "shape.round": "Rund",
    "shape.bladed": "Flach",
    "build.material": "Material",
    "build.shape": "Form",
    "build.diameter": "Durchmesser",
    "build.width": "Breite",
    "build.thickness": "Dicke",
    "build.massPerM": "Masse pro Meter"
  },
  "en": {
    "nav.measure": "Measure",
    "nav.wheel": "Wheel",
    "nav.guide": "Guide",
    "gauge.freq": "Frequency",
    "gauge.listening": "Listening…",
    "gauge.tension": "Tension",
    "hint.idle": "Tap “Listen”, then pluck the spoke.",
    "hint.start": "Pluck the spoke … tap “Stop” once the note is steady.",
    "hint.micError": "Microphone access required (HTTPS/localhost) or unavailable.",
    "hint.stopped": "Measurement stopped.",
    "hint.detected": "Note detected. Value can be applied.",
    "hint.aborted": "Measurement cancelled.",
    "hint.noClear": "No clear note detected.",
    "hint.autoListen": "Pluck spoke {n} … captured automatically.",
    "btn.listen": "Listen",
    "btn.stop": "Stop",
    "unit.N": "N",
    "unit.kgf": "kgf",
    "ctx.noWheel": "No active wheel. In the “Wheel” tab, create a wheel (profile + free lengths left/right) and select a spoke to calculate tension and apply measurements.",
    "ctx.activeWheel": "Active wheel",
    "ctx.wheel": "Wheel",
    "ctx.profile": "Profile",
    "ctx.spoke": "Spoke",
    "ctx.freeLength": "Free length",
    "ctx.noSpokeSelected": "No spoke selected – tap one in the Wheel tab.",
    "ctx.editHint": "Change the profile & lengths in the Wheel tab.",
    "ctx.unit": "Unit",
    "label.nr": "No.",
    "label.spokes": "Spokes",
    "btn.applyToSpoke": "Apply to spoke {n}",
    "apply.needWheel": "First create a wheel in the “Wheel” tab and select a spoke to apply the measurement.",
    "toast.applied": "Applied to spoke {n}.",
    "create.title": "New wheel",
    "create.name": "Name",
    "create.defaultName": "My wheel",
    "create.fallbackName": "Wheel",
    "create.position": "Position",
    "create.spokeCount": "Spoke count",
    "create.create": "Create wheel",
    "pos.front": "Front wheel",
    "pos.rear": "Rear wheel",
    "side.left": "Left",
    "side.right": "Right",
    "btn.newWheel": "New wheel",
    "build.title": "Build",
    "build.subtitle": "Spoke profile and free lengths of this wheel.",
    "build.profile": "Spoke profile",
    "build.freeLeft": "Free length left",
    "build.freeRight": "Free length right",
    "build.note": "Free spoke length = from the nipple seat to the spoke elbow at the hub. Left/right can differ (e.g. rear wheel).",
    "legend.unmeasured": "unmeasured",
    "legend.inBand": "in band",
    "legend.outBand": "out of band",
    "confirm.discardWheel": "The current wheel, including all measurements, will be discarded. Continue?",
    "spoke.tapToSelect": "Tap a spoke to select it.",
    "spoke.side": "Side",
    "spoke.notMeasured": "Not yet measured. Measure it in the “Measure” tab.",
    "even.title": "Uniformity",
    "even.measured": "measured",
    "even.noData": "No measurements yet for this side.",
    "stat.mean": "Mean",
    "stat.min": "Min",
    "stat.max": "Max",
    "stat.spread": "Spread",
    "even.band": "Within ±10% band",
    "even.footer": "Uniform tension per side does not automatically mean the wheel is centred.",
    "material.steel": "Steel",
    "aria.wheel": "Wheel with {n} spokes",
    "material.stainless": "Stainless steel",
    "material.aluminium": "Aluminium",
    "material.titanium": "Titanium",
    "material.carbon": "Carbon",
    "shape.round": "Round",
    "shape.bladed": "Bladed",
    "build.material": "Material",
    "build.shape": "Shape",
    "build.diameter": "Diameter",
    "build.width": "Width",
    "build.thickness": "Thickness",
    "build.massPerM": "Mass per meter"
  },
  "fr": {
    "nav.measure": "Mesurer",
    "nav.wheel": "Roue",
    "nav.guide": "Guide",
    "gauge.freq": "Fréquence",
    "gauge.listening": "À l’écoute…",
    "gauge.tension": "Tension",
    "hint.idle": "Touche « Écouter », puis pince le rayon.",
    "hint.start": "Pince le rayon… touche « Arrêter » quand le son est stable.",
    "hint.micError": "Accès au microphone requis (HTTPS/localhost) ou indisponible.",
    "hint.stopped": "Mesure arrêtée.",
    "hint.detected": "Son détecté. La valeur peut être appliquée.",
    "hint.aborted": "Mesure interrompue.",
    "hint.noClear": "Aucun son clair détecté.",
    "hint.autoListen": "Pince le rayon {n}… capture automatique.",
    "btn.listen": "Écouter",
    "btn.stop": "Arrêter",
    "unit.N": "N",
    "unit.kgf": "kgf",
    "ctx.noWheel": "Aucune roue active. Crée une roue dans l’onglet « Roue » (profil + longueurs libres gauche/droite) et sélectionne un rayon pour calculer la tension et appliquer les mesures.",
    "ctx.activeWheel": "Roue active",
    "ctx.wheel": "Roue",
    "ctx.profile": "Profil",
    "ctx.spoke": "Rayon",
    "ctx.freeLength": "Longueur libre",
    "ctx.noSpokeSelected": "Aucun rayon sélectionné – touche-le dans l’onglet Roue.",
    "ctx.editHint": "Le profil et les longueurs se modifient dans l’onglet Roue.",
    "ctx.unit": "Unité",
    "label.nr": "N°",
    "label.spokes": "Rayons",
    "btn.applyToSpoke": "Appliquer au rayon {n}",
    "apply.needWheel": "Crée d’abord une roue dans l’onglet « Roue » et sélectionne un rayon pour appliquer la mesure.",
    "toast.applied": "Appliqué au rayon {n}.",
    "create.title": "Nouvelle roue",
    "create.name": "Nom",
    "create.defaultName": "Ma roue",
    "create.fallbackName": "Roue",
    "create.position": "Position",
    "create.spokeCount": "Nombre de rayons",
    "create.create": "Créer la roue",
    "pos.front": "Roue avant",
    "pos.rear": "Roue arrière",
    "side.left": "Gauche",
    "side.right": "Droite",
    "btn.newWheel": "Nouvelle roue",
    "build.title": "Montage",
    "build.subtitle": "Profil de rayon et longueurs libres de cette roue.",
    "build.profile": "Profil de rayon",
    "build.freeLeft": "Longueur libre gauche",
    "build.freeRight": "Longueur libre droite",
    "build.note": "Longueur libre de vibration = du siège de l’écrou jusqu’au coude du rayon au niveau du moyeu. Gauche et droite peuvent différer (p. ex. roue arrière).",
    "legend.unmeasured": "non mesuré",
    "legend.inBand": "dans la plage",
    "legend.outBand": "hors plage",
    "confirm.discardWheel": "La roue actuelle, y compris toutes les mesures, sera supprimée. Continuer ?",
    "spoke.tapToSelect": "Touche un rayon pour le sélectionner.",
    "spoke.side": "Côté",
    "spoke.notMeasured": "Pas encore mesuré. Mesure dans l’onglet « Mesurer ».",
    "even.title": "Régularité",
    "even.measured": "mesuré",
    "even.noData": "Aucune mesure pour ce côté pour l’instant.",
    "stat.mean": "Moyenne",
    "stat.min": "Min",
    "stat.max": "Max",
    "stat.spread": "Dispersion",
    "even.band": "Dans la plage ±10 %",
    "even.footer": "Une tension régulière par côté ne signifie pas automatiquement un centrage.",
    "material.steel": "Acier",
    "aria.wheel": "Roue à {n} rayons",
    "material.stainless": "Acier inox",
    "material.aluminium": "Aluminium",
    "material.titanium": "Titane",
    "material.carbon": "Carbone",
    "shape.round": "Rond",
    "shape.bladed": "Lamé",
    "build.material": "Matériau",
    "build.shape": "Forme",
    "build.diameter": "Diamètre",
    "build.width": "Largeur",
    "build.thickness": "Épaisseur",
    "build.massPerM": "Masse par mètre"
  },
  "es": {
    "nav.measure": "Medir",
    "nav.wheel": "Rueda",
    "nav.guide": "Guía",
    "gauge.freq": "Frecuencia",
    "gauge.listening": "Escuchando…",
    "gauge.tension": "Tensión",
    "hint.idle": "Pulsa «Escuchar» y luego pulsa el radio.",
    "hint.start": "Pulsa el radio… toca «Detener» cuando el tono se estabilice.",
    "hint.micError": "Se necesita acceso al micrófono (HTTPS/localhost) o no está disponible.",
    "hint.stopped": "Medición detenida.",
    "hint.detected": "Tono detectado. Se puede aplicar el valor.",
    "hint.aborted": "Medición cancelada.",
    "hint.noClear": "No se detectó ningún tono claro.",
    "hint.autoListen": "Pulsa el radio {n}… se captura automáticamente.",
    "btn.listen": "Escuchar",
    "btn.stop": "Detener",
    "unit.N": "N",
    "unit.kgf": "kgf",
    "ctx.noWheel": "No hay ninguna rueda activa. En la pestaña «Rueda» crea una rueda (perfil + longitudes libres izquierda/derecha) y selecciona un radio para calcular la tensión y aplicar las mediciones.",
    "ctx.activeWheel": "Rueda activa",
    "ctx.wheel": "Rueda",
    "ctx.profile": "Perfil",
    "ctx.spoke": "Radio",
    "ctx.freeLength": "Longitud libre",
    "ctx.noSpokeSelected": "Ningún radio seleccionado: púlsalo en la pestaña Rueda.",
    "ctx.editHint": "El perfil y las longitudes se modifican en la pestaña Rueda.",
    "ctx.unit": "Unidad",
    "label.nr": "Nº",
    "label.spokes": "Radios",
    "btn.applyToSpoke": "Aplicar al radio {n}",
    "apply.needWheel": "En la pestaña «Rueda» crea primero una rueda y selecciona un radio para aplicar la medición.",
    "toast.applied": "Aplicado al radio {n}.",
    "create.title": "Nueva rueda",
    "create.name": "Nombre",
    "create.defaultName": "Mi rueda",
    "create.fallbackName": "Rueda",
    "create.position": "Posición",
    "create.spokeCount": "Número de radios",
    "create.create": "Crear rueda",
    "pos.front": "Rueda delantera",
    "pos.rear": "Rueda trasera",
    "side.left": "Izquierda",
    "side.right": "Derecha",
    "btn.newWheel": "Nueva rueda",
    "build.title": "Montaje",
    "build.subtitle": "Perfil de radio y longitudes libres de esta rueda.",
    "build.profile": "Perfil del radio",
    "build.freeLeft": "Longitud libre izquierda",
    "build.freeRight": "Longitud libre derecha",
    "build.note": "Longitud libre de vibración = desde el asiento de la cabecilla hasta el codo del radio en el buje. La izquierda y la derecha pueden ser diferentes (p. ej., en la rueda trasera).",
    "legend.unmeasured": "sin medir",
    "legend.inBand": "dentro de la banda",
    "legend.outBand": "fuera",
    "confirm.discardWheel": "Se descartará la rueda actual junto con todas las mediciones. ¿Continuar?",
    "spoke.tapToSelect": "Pulsa un radio para seleccionarlo.",
    "spoke.side": "Lado",
    "spoke.notMeasured": "Aún sin medir. Mide en la pestaña «Medir».",
    "even.title": "Uniformidad",
    "even.measured": "medido",
    "even.noData": "Aún no hay mediciones para este lado.",
    "stat.mean": "Media",
    "stat.min": "Mín",
    "stat.max": "Máx",
    "stat.spread": "Dispersión",
    "even.band": "En la banda ±10 %",
    "even.footer": "Una tensión uniforme por lado no implica automáticamente que esté centrada.",
    "material.steel": "Acero",
    "aria.wheel": "Rueda con {n} radios",
    "material.stainless": "Acero inoxidable",
    "material.aluminium": "Aluminio",
    "material.titanium": "Titanio",
    "material.carbon": "Carbono",
    "shape.round": "Redondo",
    "shape.bladed": "Plano",
    "build.material": "Material",
    "build.shape": "Forma",
    "build.diameter": "Diámetro",
    "build.width": "Anchura",
    "build.thickness": "Grosor",
    "build.massPerM": "Masa por metro"
  },
  "it": {
    "nav.measure": "Misurazione",
    "nav.wheel": "Ruota",
    "nav.guide": "Guida",
    "gauge.freq": "Frequenza",
    "gauge.listening": "In ascolto…",
    "gauge.tension": "Tensione",
    "hint.idle": "Tocca «Ascolta» e poi pizzica il raggio.",
    "hint.start": "Pizzica il raggio … tocca «Ferma» quando il suono è stabile.",
    "hint.micError": "Accesso al microfono necessario (HTTPS/localhost) o non disponibile.",
    "hint.stopped": "Misurazione fermata.",
    "hint.detected": "Suono rilevato. Il valore può essere acquisito.",
    "hint.aborted": "Misurazione interrotta.",
    "hint.noClear": "Nessun suono chiaro rilevato.",
    "hint.autoListen": "Pizzica il raggio {n} … acquisizione automatica.",
    "btn.listen": "Ascolta",
    "btn.stop": "Ferma",
    "unit.N": "N",
    "unit.kgf": "kgf",
    "ctx.noWheel": "Nessuna ruota attiva. Nella scheda «Ruota» crea una ruota (profilo + lunghezze libere sinistra/destra) e seleziona un raggio per calcolare la tensione e acquisire i valori misurati.",
    "ctx.activeWheel": "Ruota attiva",
    "ctx.wheel": "Ruota",
    "ctx.profile": "Profilo",
    "ctx.spoke": "Raggio",
    "ctx.freeLength": "Lunghezza libera",
    "ctx.noSpokeSelected": "Nessun raggio selezionato – tocca nella scheda Ruota.",
    "ctx.editHint": "Profilo e lunghezze si modificano nella scheda Ruota.",
    "ctx.unit": "Unità",
    "label.nr": "N.",
    "label.spokes": "Raggi",
    "btn.applyToSpoke": "Applica al raggio {n}",
    "apply.needWheel": "Nella scheda «Ruota» crea prima una ruota e seleziona un raggio per acquisire il valore misurato.",
    "toast.applied": "Applicato al raggio {n}.",
    "create.title": "Nuova ruota",
    "create.name": "Nome",
    "create.defaultName": "La mia ruota",
    "create.fallbackName": "Ruota",
    "create.position": "Posizione",
    "create.spokeCount": "Numero di raggi",
    "create.create": "Crea ruota",
    "pos.front": "Ruota anteriore",
    "pos.rear": "Ruota posteriore",
    "side.left": "Sinistra",
    "side.right": "Destra",
    "btn.newWheel": "Nuova ruota",
    "build.title": "Costruzione",
    "build.subtitle": "Profilo dei raggi e lunghezze libere di questa ruota.",
    "build.profile": "Profilo del raggio",
    "build.freeLeft": "Lunghezza libera sinistra",
    "build.freeRight": "Lunghezza libera destra",
    "build.note": "Lunghezza libera di oscillazione = dalla sede del nipplo fino alla curva del raggio al mozzo. Sinistra e destra possono essere diverse (ad es. ruota posteriore).",
    "legend.unmeasured": "non misurato",
    "legend.inBand": "nella banda",
    "legend.outBand": "fuori banda",
    "confirm.discardWheel": "La ruota attuale, inclusi tutti i valori misurati, verrà scartata. Continuare?",
    "spoke.tapToSelect": "Tocca un raggio per selezionarlo.",
    "spoke.side": "Lato",
    "spoke.notMeasured": "Non ancora misurato. Misura nella scheda «Misurazione».",
    "even.title": "Uniformità",
    "even.measured": "misurato",
    "even.noData": "Ancora nessun valore misurato per questo lato.",
    "stat.mean": "Media",
    "stat.min": "Min",
    "stat.max": "Max",
    "stat.spread": "Dispersione",
    "even.band": "Nella banda ±10%",
    "even.footer": "Una tensione uniforme per lato non significa automaticamente che la ruota sia centrata.",
    "material.steel": "Acciaio",
    "aria.wheel": "Ruota con {n} raggi",
    "material.stainless": "Acciaio inox",
    "material.aluminium": "Alluminio",
    "material.titanium": "Titanio",
    "material.carbon": "Carbonio",
    "shape.round": "Tondo",
    "shape.bladed": "Lamellare",
    "build.material": "Materiale",
    "build.shape": "Forma",
    "build.diameter": "Diametro",
    "build.width": "Larghezza",
    "build.thickness": "Spessore",
    "build.massPerM": "Massa per metro"
  },
  "nl": {
    "nav.measure": "Meten",
    "nav.wheel": "Wiel",
    "nav.guide": "Gids",
    "gauge.freq": "Frequentie",
    "gauge.listening": "Luistert…",
    "gauge.tension": "Spanning",
    "hint.idle": "Tik op „Luisteren\" en tokkel daarna de spaak aan.",
    "hint.start": "Spaak aantokkelen … tik op „Stoppen\" als de toon stabiel is.",
    "hint.micError": "Microfoontoegang nodig (HTTPS/localhost) of niet beschikbaar.",
    "hint.stopped": "Meting gestopt.",
    "hint.detected": "Toon herkend. Waarde kan worden overgenomen.",
    "hint.aborted": "Meting afgebroken.",
    "hint.noClear": "Geen duidelijke toon herkend.",
    "hint.autoListen": "Spaak {n} aantokkelen … wordt automatisch overgenomen.",
    "btn.listen": "Luisteren",
    "btn.stop": "Stoppen",
    "unit.N": "N",
    "unit.kgf": "kgf",
    "ctx.noWheel": "Geen wiel actief. Maak in het tabblad „Wiel\" een wiel aan (profiel + vrije lengtes links/rechts) en kies een spaak om de spanning te berekenen en meetwaarden over te nemen.",
    "ctx.activeWheel": "Actief wiel",
    "ctx.wheel": "Wiel",
    "ctx.profile": "Profiel",
    "ctx.spoke": "Spaak",
    "ctx.freeLength": "Vrije lengte",
    "ctx.noSpokeSelected": "Geen spaak gekozen – tik aan in het wiel-tabblad.",
    "ctx.editHint": "Profiel & lengtes wijzig je in het wiel-tabblad.",
    "ctx.unit": "Eenheid",
    "label.nr": "Nr.",
    "label.spokes": "Spaken",
    "btn.applyToSpoke": "Op spaak {n} overnemen",
    "apply.needWheel": "Maak in het tabblad „Wiel\" eerst een wiel aan en kies een spaak om de meetwaarde over te nemen.",
    "toast.applied": "Op spaak {n} overgenomen.",
    "create.title": "Nieuw wiel",
    "create.name": "Naam",
    "create.defaultName": "Mijn wiel",
    "create.fallbackName": "Wiel",
    "create.position": "Positie",
    "create.spokeCount": "Aantal spaken",
    "create.create": "Wiel aanmaken",
    "pos.front": "Voorwiel",
    "pos.rear": "Achterwiel",
    "side.left": "Links",
    "side.right": "Rechts",
    "btn.newWheel": "Nieuw wiel",
    "build.title": "Opbouw",
    "build.subtitle": "Spaakprofiel en vrije lengtes van dit wiel.",
    "build.profile": "Spaakprofiel",
    "build.freeLeft": "Vrije lengte links",
    "build.freeRight": "Vrije lengte rechts",
    "build.note": "Vrije trillengte = van de nippelzitting tot de spaakbocht aan de naaf. Links/rechts kunnen verschillen (bijv. achterwiel).",
    "legend.unmeasured": "ongemeten",
    "legend.inBand": "binnen band",
    "legend.outBand": "buiten band",
    "confirm.discardWheel": "Het huidige wiel inclusief alle meetwaarden wordt verworpen. Doorgaan?",
    "spoke.tapToSelect": "Tik een spaak aan om deze te selecteren.",
    "spoke.side": "Zijde",
    "spoke.notMeasured": "Nog niet gemeten. Meet in het tabblad „Meten\".",
    "even.title": "Gelijkmatigheid",
    "even.measured": "gemeten",
    "even.noData": "Nog geen meetwaarden voor deze zijde.",
    "stat.mean": "Gemiddelde",
    "stat.min": "Min",
    "stat.max": "Max",
    "stat.spread": "Spreiding",
    "even.band": "Binnen ±10%-band",
    "even.footer": "Gelijkmatige spanning per zijde is niet automatisch gecentreerd.",
    "material.steel": "Staal",
    "aria.wheel": "Wiel met {n} spaken",
    "material.stainless": "Roestvrij staal",
    "material.aluminium": "Aluminium",
    "material.titanium": "Titanium",
    "material.carbon": "Carbon",
    "shape.round": "Rond",
    "shape.bladed": "Plat",
    "build.material": "Materiaal",
    "build.shape": "Vorm",
    "build.diameter": "Diameter",
    "build.width": "Breedte",
    "build.thickness": "Dikte",
    "build.massPerM": "Massa per meter"
  }
};

const GUIDE = {
  "de": [
    {
      "title": "⚠️ Ursachen für abgerissene Speichennippel",
      "points": [
        "Zu hohe oder ungleichmäßige Spannung überlastet die Gewindegänge; schwankende Spannung bedeutet ständige Wechsellast (Materialermüdung).",
        "Materialermüdung vor allem bei Aluminium-Nippeln: leichter, aber anfälliger für Ermüdung und Korrosion durch Streusalz und Nässe als Messing.",
        "Falsche Speichenlänge: zu kurz greift zu wenig ins Gewinde und reißt unter Zug; zu lang ragt in den Nippelkopf und schwächt ihn.",
        "Mechanische Überlastung: hohes Fahrergewicht, Gepäck oder harte Schläge im Gelände."
      ]
    },
    {
      "title": "🩹 Unterwegs: Notfall",
      "points": [
        "Mit gerissener Speiche oder gerissenem Nippel nicht weit fahren: Unwucht, Höhen- und Seitenschlag sowie Folgebrüche drohen.",
        "Defekte Speiche zum Heimkommen um eine Nachbarspeiche wickeln, damit sie nicht schlackert.",
        "Danach den Nippel ersetzen und das Laufrad zentrieren bzw. die Spannung prüfen lassen."
      ]
    },
    {
      "title": "🔧 Speichenspannung anpassen",
      "points": [
        "Werkzeug: passender Zentrier- bzw. Speichenschlüssel, damit der Nippel nicht runddreht.",
        "Nippel von oben (vom Reifen aus gesehen) im Uhrzeigersinn = SPANNEN, gegen den Uhrzeigersinn = ENTSPANNEN.",
        "Reifen, Schlauch und Felgenband abnehmen, um die Nippelköpfe von innen zu sehen.",
        "Ein Tropfen Kriechöl (z. B. WD-40) aufs Gewinde verhindert das Mitdrehen der Speiche.",
        "Immer nur kleine Schritte (max. ¼-Drehung pro Durchgang) und gleichmäßig rundum.",
        "Speichen wie Gitarrensaiten zupfen: auf gleicher Laufradseite ergibt sich ein ähnlicher Ton — gleiche Note ≈ gleiche Spannung.",
        "Mit Zentrierständer oder im Rahmen auf Höhen- und Seitenschlag prüfen.",
        "Tipp gegen Mitdrehen bei Rundspeichen: den Nippel etwas über das Ziel hinaus und dann minimal zurückdrehen."
      ]
    },
    {
      "title": "🎵 Tensiometer & Hz-/Noten-Methode",
      "points": [
        "Eine Speiche steht wie eine Saite unter Zug; gezupft erzeugt sie einen messbaren Ton.",
        "Höhere Frequenz (Hz) bzw. höhere Note bedeutet höhere Spannung.",
        "Zum Trimmen: alle Speichen einer Seite auf dieselbe Note (Nadel mittig, 0 ct) bringen — das ist schneller als Hz-Zahlen zu vergleichen.",
        "Bei dicken, sehr kurzen oder plattgedrückten Messerspeichen schwingt das Material schlecht, daher wird die Messung ungenau."
      ],
      "note": "Formel: T = 4 · µ · L² · f²  (T in Newton, µ = Masse pro Meter in kg/m, L = freie Schwinglänge in m, f in Hz).\n\nWichtig: Eine 2,0-mm-Stahlspeiche wiegt NICHT 6–7 g/m, sondern rund 24,7 g/m. Die „6–7 g“ sind das Gewicht EINER ganzen Speiche, nicht pro Meter. Diese App rechnet µ physikalisch korrekt aus Durchmesser und Materialdichte."
    },
    {
      "title": "🎯 Gleiche Spannung ≠ zentriert",
      "points": [
        "Gleichmäßige Spannung allein bedeutet NICHT, dass das Laufrad zentriert (rund und mittig) läuft.",
        "Felgen- und Nabentoleranzen sowie Vorschäden erzwingen lokal leichte Spannungsunterschiede.",
        "Vorne (Scheibenbremse) bzw. hinten (Kassette) ist die Nabe asymmetrisch: die steileren Speichen einer Seite brauchen deutlich mehr Spannung (oft 30–40 %), damit die Felge mittig sitzt.",
        "Gleichheit nur INNERHALB derselben Seite anstreben (Ziel: max. ±10 % Abweichung vom Mittel).",
        "Merksatz: Zentrierung bestimmt, WO die Felge steht; gleichmäßige Spannung, WIE LANGE sie hält."
      ]
    }
  ],
  "en": [
    {
      "title": "⚠️ Causes of torn-off spoke nipples",
      "points": [
        "Excessive or uneven tension overloads the threads; fluctuating tension means constant alternating load (material fatigue).",
        "Material fatigue, especially with aluminium nipples: lighter, but more prone to fatigue and to corrosion from road salt and moisture than brass.",
        "Wrong spoke length: too short engages too little of the thread and tears under load; too long protrudes into the nipple head and weakens it.",
        "Mechanical overload: high rider weight, luggage or hard impacts off-road."
      ]
    },
    {
      "title": "🩹 On the road: emergency",
      "points": [
        "Do not ride far with a broken spoke or broken nipple: imbalance, radial and lateral runout, and follow-on breakages are likely.",
        "To get home, wind the broken spoke around a neighbouring spoke so it does not rattle around.",
        "Afterwards, replace the nipple and have the wheel trued or the tension checked."
      ]
    },
    {
      "title": "🔧 Adjusting spoke tension",
      "points": [
        "Tool: a properly fitting spoke wrench so the nipple does not round off.",
        "Turning the nipple from above (as seen from the tyre side) clockwise = TIGHTEN, anticlockwise = LOOSEN.",
        "Remove the tyre, tube and rim tape to see the nipple heads from the inside.",
        "A drop of penetrating oil (e.g. WD-40) on the thread prevents the spoke from twisting along.",
        "Always work in small steps (max. ¼ turn per pass) and evenly all the way round.",
        "Pluck the spokes like guitar strings: on the same side of the wheel they should produce a similar note — same note ≈ same tension.",
        "Check for radial and lateral runout in a truing stand or in the frame.",
        "Tip against twisting with round spokes: turn the nipple slightly past the target and then back off a fraction."
      ]
    },
    {
      "title": "🎵 Tensiometer & Hz/note method",
      "points": [
        "A spoke is under tension like a string; when plucked it produces a measurable note.",
        "A higher frequency (Hz) or higher note means higher tension.",
        "To trim: bring all spokes on one side to the same note (needle centred, 0 ct) — that is faster than comparing Hz figures.",
        "With thick, very short or flattened bladed spokes the material vibrates poorly, so the measurement becomes inaccurate."
      ],
      "note": "Formula: T = 4 · µ · L² · f²  (T in newtons, µ = mass per meter in kg/m, L = free spoke length in m, f in Hz).\n\nImportant: A 2.0 mm steel spoke does NOT weigh 6–7 g/m, but around 24.7 g/m. The “6–7 g” is the weight of ONE whole spoke, not per meter. This app computes µ in a physically correct way from diameter and material density."
    },
    {
      "title": "🎯 Equal tension ≠ centred",
      "points": [
        "Uniform tension alone does NOT mean the wheel runs centred (round and true).",
        "Rim and hub tolerances as well as pre-existing damage force slight local tension differences.",
        "At the front (disc brake) or rear (cassette) the hub is asymmetric: the steeper spokes on one side need significantly more tension (often 30–40 %) so the rim sits centred.",
        "Aim for uniformity only WITHIN the same side (target: max. ±10 % deviation from the mean).",
        "Rule of thumb: centring determines WHERE the rim sits; uniform tension, HOW LONG it holds."
      ]
    }
  ],
  "fr": [
    {
      "title": "⚠️ Causes de l’arrachement des écrous de rayon",
      "points": [
        "Une tension trop élevée ou irrégulière surcharge les filets ; une tension fluctuante implique une charge alternée constante (fatigue du matériau).",
        "Fatigue du matériau, surtout avec les écrous en aluminium : plus légers, mais plus sensibles à la fatigue et à la corrosion par le sel de déneigement et l’humidité que le laiton.",
        "Mauvaise longueur de rayon : trop court, il prend trop peu dans le filet et casse sous la traction ; trop long, il dépasse dans la tête de l’écrou et l’affaiblit.",
        "Surcharge mécanique : poids élevé du cycliste, bagages ou chocs violents en tout-terrain."
      ]
    },
    {
      "title": "🩹 En chemin : urgence",
      "points": [
        "Avec un rayon ou un écrou cassé, ne roule pas longtemps : balourd, voile et saut ainsi que ruptures consécutives menacent.",
        "Pour rentrer, enroule le rayon défectueux autour d’un rayon voisin pour qu’il ne ballotte pas.",
        "Ensuite, remplace l’écrou et fais centrer la roue ou contrôler la tension."
      ]
    },
    {
      "title": "🔧 Ajuster la tension des rayons",
      "points": [
        "Outil : clé à rayons (clé de centrage) adaptée, pour que l’écrou ne tourne pas en rond.",
        "Écrou vu du dessus (côté pneu) dans le sens des aiguilles d’une montre = TENDRE, dans le sens inverse = DÉTENDRE.",
        "Retire le pneu, la chambre à air et le fond de jante pour voir les têtes d’écrou depuis l’intérieur.",
        "Une goutte d’huile pénétrante (p. ex. WD-40) sur le filet empêche le rayon de tourner avec l’écrou.",
        "Toujours par petits pas (max. ¼ de tour par passage) et de façon régulière sur tout le pourtour.",
        "Pince les rayons comme des cordes de guitare : sur le même côté de la roue, le son est similaire — même note ≈ même tension.",
        "Vérifie le voile et le saut sur un support de centrage ou dans le cadre.",
        "Astuce contre l’entraînement des rayons ronds : tourne l’écrou légèrement au-delà de l’objectif, puis reviens un tout petit peu en arrière."
      ]
    },
    {
      "title": "🎵 Tensiomètre & méthode Hz/notes",
      "points": [
        "Un rayon est sous traction comme une corde ; pincé, il produit un son mesurable.",
        "Une fréquence plus élevée (Hz), donc une note plus aiguë, signifie une tension plus élevée.",
        "Pour l’égalisation : amène tous les rayons d’un côté à la même note (aiguille au centre, 0 ct) — c’est plus rapide que de comparer des valeurs en Hz.",
        "Avec des rayons plats (lames) épais, très courts ou aplatis, le matériau vibre mal, ce qui rend la mesure imprécise."
      ],
      "note": "Formule : T = 4 · µ · L² · f²  (T en newtons, µ = masse par mètre en kg/m, L = longueur libre de vibration en m, f en Hz).\n\nImportant : un rayon en acier de 2,0 mm ne pèse PAS 6–7 g/m, mais environ 24,7 g/m. Les « 6–7 g » sont le poids d’UN rayon entier, pas par mètre. Cette appli calcule µ de façon physiquement correcte à partir du diamètre et de la densité du matériau."
    },
    {
      "title": "🎯 Tension égale ≠ centré",
      "points": [
        "Une tension régulière à elle seule ne signifie PAS que la roue est centrée (ronde et bien centrée latéralement).",
        "Les tolérances de jante et de moyeu ainsi que les dommages préexistants imposent localement de légères différences de tension.",
        "À l’avant (frein à disque) ou à l’arrière (cassette), le moyeu est asymétrique : les rayons plus inclinés d’un côté ont besoin de nettement plus de tension (souvent 30–40 %) pour que la jante soit bien centrée.",
        "Ne vise l’égalité qu’À L’INTÉRIEUR d’un même côté (objectif : max. ±10 % d’écart par rapport à la moyenne).",
        "À retenir : le centrage détermine OÙ se trouve la jante ; une tension régulière, COMBIEN DE TEMPS elle tient."
      ]
    }
  ],
  "es": [
    {
      "title": "⚠️ Causas de cabecillas de radio arrancadas",
      "points": [
        "Una tensión demasiado alta o desigual sobrecarga los filetes de la rosca; una tensión variable supone una carga alterna constante (fatiga del material).",
        "Fatiga del material, sobre todo en las cabecillas de aluminio: más ligeras, pero más propensas a la fatiga y a la corrosión por la sal de deshielo y la humedad que las de latón.",
        "Longitud de radio incorrecta: si es demasiado corto, agarra muy poco en la rosca y se rompe bajo tracción; si es demasiado largo, sobresale en la cabeza de la cabecilla y la debilita.",
        "Sobrecarga mecánica: peso elevado del ciclista, equipaje o golpes fuertes en terreno irregular."
      ]
    },
    {
      "title": "🩹 En ruta: emergencia",
      "points": [
        "No circules mucho con un radio o una cabecilla rotos: hay riesgo de desequilibrio, desvío vertical y lateral, así como roturas en cadena.",
        "Para volver a casa, enrolla el radio defectuoso alrededor de un radio vecino para que no quede suelto.",
        "Después, sustituye la cabecilla y manda centrar la rueda o comprobar la tensión."
      ]
    },
    {
      "title": "🔧 Ajustar la tensión de los radios",
      "points": [
        "Herramienta: la llave de centrado o de radios adecuada, para que la cabecilla no se redondee.",
        "Cabecilla vista desde arriba (desde el neumático), en el sentido de las agujas del reloj = TENSAR, en sentido contrario a las agujas del reloj = DESTENSAR.",
        "Retira el neumático, la cámara y la cinta de llanta para ver las cabezas de las cabecillas desde dentro.",
        "Una gota de aceite penetrante (p. ej., WD-40) en la rosca evita que el radio gire con ella.",
        "Avanza siempre en pasos pequeños (máx. ¼ de vuelta por pasada) y de forma uniforme alrededor de toda la rueda.",
        "Pulsa los radios como las cuerdas de una guitarra: en el mismo lado de la rueda se obtiene un tono parecido — misma nota ≈ misma tensión.",
        "Comprueba el desvío vertical y lateral con un soporte de centrado o dentro del cuadro.",
        "Truco contra el arrastre en radios redondos: gira la cabecilla un poco más allá del objetivo y luego retrocede mínimamente."
      ]
    },
    {
      "title": "🎵 Tensiómetro y método de Hz/notas",
      "points": [
        "Un radio está bajo tracción como una cuerda; al pulsarlo genera un tono medible.",
        "Una frecuencia (Hz) más alta o una nota más aguda significan una tensión mayor.",
        "Para igualar: lleva todos los radios de un lado a la misma nota (aguja centrada, 0 ct) — es más rápido que comparar cifras de Hz.",
        "En radios planos (aero), muy cortos o aplastados, el material vibra mal, por lo que la medición resulta imprecisa."
      ],
      "note": "Fórmula: T = 4 · µ · L² · f²  (T en newtons, µ = masa por metro en kg/m, L = longitud libre de vibración en m, f en Hz).\n\nImportante: un radio de acero de 2,0 mm NO pesa 6–7 g/m, sino unos 24,7 g/m. Los «6–7 g» son el peso de UN radio entero, no por metro. Esta app calcula µ de forma físicamente correcta a partir del diámetro y la densidad del material."
    },
    {
      "title": "🎯 Misma tensión ≠ centrada",
      "points": [
        "Una tensión uniforme por sí sola NO significa que la rueda esté centrada (redonda y al medio).",
        "Las tolerancias de la llanta y del buje, así como los daños previos, obligan a leves diferencias de tensión locales.",
        "Delante (freno de disco) o detrás (casete) el buje es asimétrico: los radios más inclinados de un lado necesitan bastante más tensión (a menudo un 30–40 %) para que la llanta quede centrada.",
        "Busca la igualdad solo DENTRO del mismo lado (objetivo: máx. ±10 % de desviación respecto a la media).",
        "Regla mnemotécnica: el centrado determina DÓNDE queda la llanta; la tensión uniforme, CUÁNTO dura."
      ]
    }
  ],
  "it": [
    {
      "title": "⚠️ Cause della rottura dei nippli dei raggi",
      "points": [
        "Una tensione troppo elevata o non uniforme sovraccarica i filetti; una tensione variabile comporta un carico alternato costante (fatica del materiale).",
        "Fatica del materiale soprattutto con i nippli in alluminio: più leggeri, ma più soggetti alla fatica e alla corrosione dovuta al sale antighiaccio e all'umidità rispetto all'ottone.",
        "Lunghezza errata del raggio: troppo corto fa presa su troppo poco filetto e si rompe sotto trazione; troppo lungo sporge nella testa del nipplo e lo indebolisce.",
        "Sovraccarico meccanico: peso elevato del ciclista, bagaglio o colpi forti in fuoristrada."
      ]
    },
    {
      "title": "🩹 In viaggio: emergenza",
      "points": [
        "Con un raggio o un nipplo rotto non percorrere lunghe distanze: rischi di squilibrio, sbandamento radiale e laterale e rotture conseguenti.",
        "Per tornare a casa, avvolgi il raggio difettoso attorno a un raggio adiacente, così da evitare che sbatacchi.",
        "Successivamente sostituisci il nipplo e fai centrare la ruota o controllare la tensione."
      ]
    },
    {
      "title": "🔧 Regolare la tensione dei raggi",
      "points": [
        "Attrezzo: chiave da centratura o per nippli adatta, così che il nipplo non giri a vuoto.",
        "Nipplo visto dall'alto (dal lato del pneumatico) in senso orario = TENDERE, in senso antiorario = ALLENTARE.",
        "Rimuovi pneumatico, camera d'aria e flap del cerchio per vedere le teste dei nippli dall'interno.",
        "Una goccia di olio penetrante (ad es. WD-40) sul filetto impedisce al raggio di girare insieme.",
        "Procedi sempre a piccoli passi (max. ¼ di giro per passaggio) e in modo uniforme tutt'intorno.",
        "Pizzica i raggi come le corde di una chitarra: sullo stesso lato della ruota si ottiene un suono simile — stessa nota ≈ stessa tensione.",
        "Controlla lo sbandamento radiale e laterale con l'attrezzo di centratura o nel telaio.",
        "Suggerimento contro il trascinamento con i raggi tondi: gira il nipplo leggermente oltre l'obiettivo e poi torna indietro di pochissimo."
      ]
    },
    {
      "title": "🎵 Tensiometro e metodo Hz/note",
      "points": [
        "Un raggio è in trazione come una corda; pizzicato genera un suono misurabile.",
        "Una frequenza più alta (Hz) o una nota più alta indica una tensione maggiore.",
        "Per il bilanciamento: porta tutti i raggi di un lato alla stessa nota (ago al centro, 0 ct) — è più rapido che confrontare i valori in Hz.",
        "Con raggi a lama spessi, molto corti o schiacciati il materiale oscilla male, quindi la misurazione diventa imprecisa."
      ],
      "note": "Formula: T = 4 · µ · L² · f²  (T in Newton, µ = massa al metro in kg/m, L = lunghezza libera di oscillazione in m, f in Hz).\n\nImportante: un raggio in acciaio da 2,0 mm NON pesa 6–7 g/m, bensì circa 24,7 g/m. I «6–7 g» sono il peso di UN intero raggio, non al metro. Questa app calcola µ in modo fisicamente corretto a partire dal diametro e dalla densità del materiale."
    },
    {
      "title": "🎯 Stessa tensione ≠ centrata",
      "points": [
        "Una tensione uniforme da sola NON significa che la ruota sia centrata (rotonda e in asse).",
        "Le tolleranze del cerchio e del mozzo, così come danni preesistenti, impongono localmente lievi differenze di tensione.",
        "Davanti (freno a disco) o dietro (cassetta) il mozzo è asimmetrico: i raggi più ripidi di un lato richiedono una tensione decisamente maggiore (spesso 30–40 %), affinché il cerchio rimanga centrato.",
        "Punta all'uniformità solo ALL'INTERNO dello stesso lato (obiettivo: max. ±10 % di scostamento dalla media).",
        "Da ricordare: la centratura determina DOVE si trova il cerchio; la tensione uniforme PER QUANTO TEMPO regge."
      ]
    }
  ],
  "nl": [
    {
      "title": "⚠️ Oorzaken van afgebroken spaaknippels",
      "points": [
        "Te hoge of ongelijkmatige spanning overbelast de schroefdraad; schommelende spanning betekent voortdurende wisselbelasting (materiaalmoeheid).",
        "Materiaalmoeheid vooral bij aluminium nippels: lichter, maar gevoeliger voor moeheid en corrosie door strooizout en vocht dan messing.",
        "Verkeerde spaaklengte: te kort grijpt te weinig in de schroefdraad en breekt onder trekkracht; te lang steekt in de nippelkop en verzwakt deze.",
        "Mechanische overbelasting: hoog gewicht van de fietser, bagage of harde klappen in het terrein."
      ]
    },
    {
      "title": "🩹 Onderweg: noodgeval",
      "points": [
        "Met een gebroken spaak of gebroken nippel niet ver doorrijden: onbalans, hoogte- en zijslag evenals vervolgbreuken dreigen.",
        "Wikkel de defecte spaak om naar huis te komen om een naburige spaak, zodat deze niet rammelt.",
        "Vervang daarna de nippel en laat het wiel centreren of de spanning controleren."
      ]
    },
    {
      "title": "🔧 Spaakspanning aanpassen",
      "points": [
        "Gereedschap: passende centreersleutel of spaaksleutel, zodat de nippel niet rondtolt.",
        "Nippel van bovenaf (vanaf de band gezien) met de klok mee = SPANNEN, tegen de klok in = ONTSPANNEN.",
        "Band, binnenband en velglint verwijderen om de nippelkoppen van binnen te zien.",
        "Een druppel kruipolie (bijv. WD-40) op de schroefdraad voorkomt dat de spaak meedraait.",
        "Altijd alleen kleine stappen (max. ¼-draai per ronde) en gelijkmatig rondom.",
        "Tokkel de spaken als gitaarsnaren: aan dezelfde kant van het wiel ontstaat een vergelijkbare toon — gelijke noot ≈ gelijke spanning.",
        "Controleer met een centreerstandaard of in het frame op hoogte- en zijslag.",
        "Tip tegen meedraaien bij ronde spaken: draai de nippel iets voorbij het doel en dan minimaal terug."
      ]
    },
    {
      "title": "🎵 Tensiometer & Hz-/noten-methode",
      "points": [
        "Een spaak staat als een snaar onder trekkracht; aangetokkeld geeft hij een meetbare toon.",
        "Een hogere frequentie (Hz) of hogere noot betekent een hogere spanning.",
        "Voor het trimmen: breng alle spaken aan één zijde op dezelfde noot (naald in het midden, 0 ct) — dat gaat sneller dan Hz-waarden vergelijken.",
        "Bij dikke, zeer korte of platgedrukte messpaken trilt het materiaal slecht, waardoor de meting onnauwkeurig wordt."
      ],
      "note": "Formule: T = 4 · µ · L² · f²  (T in newton, µ = massa per meter in kg/m, L = vrije trillengte in m, f in Hz).\n\nBelangrijk: Een 2,0-mm-staalspaak weegt NIET 6–7 g/m, maar ongeveer 24,7 g/m. De „6–7 g\" is het gewicht van ÉÉN hele spaak, niet per meter. Deze app berekent µ fysisch correct uit diameter en materiaaldichtheid."
    },
    {
      "title": "🎯 Gelijke spanning ≠ gecentreerd",
      "points": [
        "Gelijkmatige spanning alleen betekent NIET dat het wiel gecentreerd (rond en in het midden) loopt.",
        "Velg- en naaftoleranties evenals voorschade dwingen plaatselijk lichte spanningsverschillen af.",
        "Voor (schijfrem) of achter (cassette) is de naaf asymmetrisch: de steilere spaken aan één zijde hebben duidelijk meer spanning nodig (vaak 30–40 %), zodat de velg in het midden zit.",
        "Streef gelijkheid alleen BINNEN dezelfde zijde na (doel: max. ±10 % afwijking van het gemiddelde).",
        "Onthoud: centreren bepaalt WAAR de velg staat; gelijkmatige spanning HOELANG dit standhoudt."
      ]
    }
  ]
};

function detectLang() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('lang');
      if (saved && LANGS.includes(saved)) return saved;
    }
  } catch (e) { /* ignore */ }
  try {
    const navs = (typeof navigator !== 'undefined') ? (navigator.languages || [navigator.language]) : [];
    for (const l of navs) {
      const p = String(l || '').slice(0, 2).toLowerCase();
      if (LANGS.includes(p)) return p;
    }
  } catch (e) { /* ignore */ }
  return 'en';
}

let LANG = detectLang();

function t(key, params) {
  let s = MESSAGES[LANG] && MESSAGES[LANG][key];
  if (s == null) s = MESSAGES.en && MESSAGES.en[key];
  if (s == null) s = MESSAGES.de && MESSAGES.de[key];
  if (s == null) return key;
  if (params) for (const k in params) s = s.split('{' + k + '}').join(params[k]);
  return s;
}

function fmtNum(value, digits = 0) {
  try {
    return new Intl.NumberFormat(LOCALES[LANG] || 'en-GB', {
      minimumFractionDigits: digits, maximumFractionDigits: digits,
    }).format(value);
  } catch (e) { return Number(value).toFixed(digits); }
}

function guideCards() { return GUIDE[LANG] || GUIDE.en || GUIDE.de; }

function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  LANG = lang;
  try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.dispatchEvent(new CustomEvent('langchange'));
  }
}

function applyStaticI18n(root) {
  if (typeof document === 'undefined') return;
  (root || document).querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LANGS, LANG_NAMES, MESSAGES, GUIDE, t, fmtNum };
}
