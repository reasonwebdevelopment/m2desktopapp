M2DesktopApp
Beschrijving

M2DesktopApp is een desktopapplicatie waarmee vastgoedtransacties automatisch worden verzameld (gescraped) van meerdere websites. De applicatie richt zich op het ophalen van gegevens over verkochte en verhuurde objecten uit verschillende vastgoedbronnen en bundelt deze informatie in één overzicht. Na het scrapen worden de resultaten opgeslagen als een Excel-bestand, zodat de gebruiker alle transacties makkelijk kan bekijken en analyseren. Ondersteunde gegevensbronnen:

Vastgoedmarkt.nl – vastgoednieuws en transacties (verkoop/verhuur van panden)
Vastgoedjournaal – platform met vastgoedtransacties en -nieuws
Logistiek.nl – logistiek/bedrijfsruimte transacties en nieuws
PropertyNL – vastgoedplatform (vereist account voor volledige data)
De workflow is als volgt: de gebruiker kiest een bron, de applicatie navigeert op de achtergrond naar de betreffende website en scrapet de nieuwste transactiedata. Gegevens zoals type transactie (bijv. verkocht), projectnaam, koper/verkoper, locatie, grootte en prijs worden uit de webpagina’s gefilterd. Deze informatie wordt vervolgens netjes verzameld en weggeschreven naar een Excel-sheet. Na voltooiing opent de applicatie automatisch de map met het gegenereerde Excel-bestand, zodat de gebruiker direct toegang heeft tot het resultaat.

Installatie
Zorg ervoor dat Node.js (LTS-versie aanbevolen) en npm geïnstalleerd zijn op uw systeem. Volg daarna deze stappen om het project lokaal te installeren:
Project ophalen: Clone de repository via git clone https://github.com/reasonwebdevelopment/m2desktopapp.git of download de ZIP en pak deze uit.
Afhankelijkheden installeren: Open een terminal/command prompt in de projectmap en voer het commando npm install uit. Dit installeert alle benodigde Node-modules die in package.json staan. (Houd rekening met een eventuele download van Chromium door Puppeteer tijdens dit proces.)
Applicatie starten: Nadat de installatie voltooid is, start u de applicatie met npm start. Er opent een Electron-venster op uw bureaublad. (Als npm start niet is geconfigureerd, kunt u ook npx electron . uitvoeren in de projectmap.)
Gebruik
Wanneer de applicatie draait, verschijnt er een venster met een eenvoudige gebruikersinterface. In dit venster zijn knoppen aanwezig voor de verschillende bronnen (zoals “Check Vastgoedmarkt.nl”, “Check Vastgoedjournaal”, “Check Logistiek.nl” en “Check PropertyNL”). Scrapen van data: Klik op de knop van de gewenste website om de gegevens op te halen. Nadat u op een knop klikt zal de applicatie een ingebouwde browser (headless of zichtbaar) aansturen om de betreffende site te openen en de nieuwste transacties te verzamelen. Tijdens het scrapen ziet u statusmeldingen in de interface, zodat u weet dat het proces bezig is (bijvoorbeeld melding dat objecten worden opgehaald). Het is normaal dat dit proces enkele seconden tot minuten duurt, afhankelijk van de hoeveelheid data en de snelheid van de website. Zorg dat u over een werkende internetverbinding beschikt en wacht geduldig tot het scrapen voltooid is. Resultaten opslaan: Zodra het scrapen gereed is, slaat M2DesktopApp de verzamelde data automatisch op in een Excel-bestand (.xlsx formaat) binnen de projectmap, in de submap excelData. Elk bestand krijgt een naam met datum/tijd (bijv. vastgoedtransacties_totaal.xlsx of nieuweData_<datum>.xlsx). De applicatie zal vervolgens de map openen waarin dit bestand is opgeslagen, en het bestand highlighten in uw verkenner. U kunt nu het Excel-bestand openen om alle verzamelde transacties te bekijken. Iedere rij in de spreadsheet vertegenwoordigt een transactierecord met de relevante details (type transactie, project, partij, locatie, oppervlakte, prijs, etc.). U kunt herhalen om data van meerdere bronnen op te halen. Bijvoorbeeld kunt u eerst Vastgoedmarkt scrapen en daarna Logistiek.nl – voor elke bron wordt een apart resultaatbestand aangemaakt. Indien gewenst kunt u deze later zelf samenvoegen voor een totaaloverzicht.

Technologieën
Deze applicatie is ontwikkeld met behulp van moderne webtechnologieën en frameworks:
Electron – voor het bouwen van de desktopapplicatie. Electron bundelt een Chromium browser en Node.js, waardoor webtechnologieën op het bureaublad kunnen draaien.
Node.js – runtime die de back-end van de applicatie aandrijft binnen Electron. Hiermee worden onder andere bestanden weggeschreven en webscraping uitgevoerd.
HTML5 en CSS3 – voor de structuur en styling van de gebruikersinterface. De interface bestaat uit een enkel HTML-bestand (index.html) met dynamische elementen.
Tailwind CSS – een utility-first CSS framework gebruikt voor de opmaak. Tailwind classes zorgen voor een responsieve en nette lay-out zonder dat handmatig veel CSS geschreven hoefde te worden.
JavaScript – de logica van de applicatie is volledig in JavaScript geschreven. Dit betreft zowel de renderer-process (front-end in het Electron venster) als de main-process (achtergrondprocess in Node.js). Communicatie daartussen verloopt via Electron’s IPC (inter-process communication) mechanismen.
Puppeteer (Node bibliotheek) – ingezet voor het webscrapen. Puppeteer start een onzichtbare Chromium browser en navigeert naar de doelwebsites, waarna DOM-elementen uitgelezen worden om de benodigde gegevens te verzamelen. Dit automatiseert als het ware een gebruiker die de site bekijkt en informatie kopieert.
ExcelJS (Node bibliotheek) – gebruikt om een Excel-spreadsheet aan te maken en te vullen met de gescrapete data. Hiermee worden kolommen gecreëerd en rijen met transactiedetails gevuld, waarna het bestand wordt weggeschreven in XLSX-formaat.
Webpack en Babel – build tools voor het bundelen en transpilen van de code. Webpack is geconfigureerd (zie webpack.preload.config.js en Babel config) om bijvoorbeeld de preload-script te bundelen en ervoor te zorgen dat alle modules correct laden in Electron. Deze tools werken op de achtergrond tijdens development; eindgebruikers hoeven hier normaliter niets mee te doen.

Afhankelijkheden
Alle benodigde afhankelijkheden zijn vastgelegd in het bestand package.json. Enkele belangrijke libraries en modules waarop dit project vertrouwt, zijn onder andere:
Electron – Zorgt voor de desktop runtime. (Tijdens npm install wordt de juiste Electron-versie gedownload.)
Puppeteer – Wordt geïnstalleerd via npm en downloadt automatisch een passende versie van Chromium voor het uitvoeren van headless browser taken.
ExcelJS – Om met Excel-bestanden te werken.
Tailwind CSS – Voor de CSS, inclusief eventueel postcss/autoprefixer als onderdeel van de build chain (al is de CSS al gegenereerd in output.css).
Webpack & Babel – Ingezet tijdens ontwikkeling om modules te bundelen; ook aanwezig in de afhankelijkheden.
Naast bovengenoemde zijn er meer (sub)afhankelijkheden die door deze pakketten worden binnengehaald. Het uitvoeren van npm install regelt dit allemaal automatisch. U hoeft zelf alleen te zorgen voor een Node.js installatie; de rest van de packages wordt lokaal in de projectmap geïnstalleerd. Opmerking: Puppeteer kan bij installatie een groter bestand (Chromium browser) downloaden. Dit gebeurt éénmalig. Zorg dus bij de eerste installatie voor een internetverbinding en enkele honderden MB schijfruimte voor deze download.
Configuratie
In principe is de applicatie direct klaar voor gebruik na installatie – er zijn weinig handmatige configuratiestappen nodig. Enkele punten om op te letten:
PropertyNL inlog: Voor het scrapen van alle data van PropertyNL is een geldig account vereist. Standaard kan de applicatie een beperkt aantal openbare resultaten ophalen. Wilt u ook achter de inlog meer gegevens scrapen, dan moet u in de code uw inloggegevens instellen. Open daarvoor modules/propertynl.js en vul uw e-mailadres en wachtwoord in op de aangegeven plekken (deze staan als variabelen of commentaar in de code). Sla het bestand op en start de applicatie opnieuw. De scraper zal dan proberen in te loggen met uw account voordat de data wordt opgehaald. (Let op: Ga voorzichtig om met uw inloggegevens en deel deze niet publiekelijk.)
Internetverbinding: De applicatie heeft een internetverbinding nodig om de websites te kunnen benaderen. Zonder verbinding zullen er geen data opgehaald kunnen worden.

Bestandslocaties: Standaard worden de outputbestanden weggeschreven in de submap excelData van het project. U kunt deze locatie wijzigen door in de code het pad aan te passen (zoek naar waar writeFile wordt aangeroepen met het pad). Zorg er ook voor dat de map bestaat; in de repository is deze map al aanwezig.

Site-structuur wijzigingen: De scraper is afhankelijk van de huidige HTML-structuur van de ondersteunde websites. Mochten de websites hun lay-out of elementklassen wijzigen, dan kan het nodig zijn om de selectoren in de code aan te passen. Deze bevinden zich in de respectievelijke modulebestanden (bijv. modules/logistiek.js, modules/vastgoedmarkt.js, etc.).
Verder is geen extra configuratie vereist. Na installatie en eventuele bovengenoemde aanpassingen kunt u de M2DesktopApp gebruiken om met één druk op de knop actuele vastgoedtransactiegegevens te verzamelen. Veel succes met het project!
