# 🏢 M2DesktopApp

**M2DesktopApp** is een desktopapplicatie waarmee vastgoedtransacties automatisch worden verzameld (gescraped) van meerdere websites. De applicatie richt zich op het ophalen van gegevens over verkochte en verhuurde objecten uit verschillende vastgoedbronnen en bundelt deze informatie in één overzicht. Na het scrapen worden de resultaten opgeslagen als een JSON-bestand om vervolgens verwerkt te worden door een Custom ChatGPT(M2 AI - WORKFLOW 2.1), zodat de gebruiker alle transacties na de verwerking makkelijk kan bekijken en analyseren.

---

## 📚 Ondersteunde gegevensbronnen

- **Vastgoedmarkt.nl** – vastgoednieuws en transacties (verkoop/verhuur van panden)  
- **Vastgoedjournaal** – platform met vastgoedtransacties en -nieuws  
- **Logistiek.nl** – logistiek/bedrijfsruimte transacties en nieuws  

---

## 🔄 Workflow

1. De gebruiker kiest een bron/button via de interface.  
2. De applicatie navigeert in de achtergrond naar de bijbehorende website.  
3. De scraper haalt de nieuwste transactiedata op, zoals:
   - Type transactie (bijv. verkocht)
   - Projectnaam
   - Koper/verkoper
   - Locatie
   - Oppervlakte
   - Prijs
4. De gegevens worden opgeslagen als een JSON bestand.  
5. Na voltooiing kan je het opgeslagen bestand vinden in de locale directory van de applicatie in /Transacties.  

---

## 💻 Installatie

Zorg ervoor dat **Node.js** (LTS-versie aanbevolen) en **npm** geïnstalleerd zijn op je systeem.

### Stappen:

1. **Repository klonen:**

   ```bash
   git clone https://github.com/reasonwebdevelopment/m2desktopapp.git
   cd m2desktopapp
---

## 📦 Afhankelijkheden installeren

```bash
npm install

---

## ▶️ Applicatie starten

```bash
npm start

---

## 🧪 Technologieën

| Technologie      | Toepassing                                      |
|------------------|--------------------------------------------------|
| Electron         | Desktopomgeving met Node.js + Chromium           |
| Node.js          | Back-end logica en scraping                      |
| HTML5 + CSS3     | Structuur en styling van de UI                   |
| Tailwind CSS     | Utility-first CSS styling                        |
| JavaScript       | Applicatielogica (front-end & back-end)          |
| Puppeteer        | Webscraping met headless Chromium                |
| ExcelJS          | Genereren en opslaan van Excel-bestanden         |
| Webpack & Babel  | Bundeling en transpiling tijdens development     |

---

## ⚠️ Site-structuur wijzigingen

Als een van de websites haar HTML wijzigt, moet je mogelijk de selectors aanpassen in:

- `modules/logistiek.js`  
- `modules/vastgoedmarkt.js`  
- `modules/vastgoedjournaal.js`  

---

## ✅ Klaar voor gebruik

Na installatie en eventuele configuratie kun je met één druk op de knop actuele vastgoedtransacties ophalen, analyseren en exporteren naar Excel.
