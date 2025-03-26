// propertyScraper.js

// E-mail: evan@reason.nl
// Password: ReasonsToRikRollRikTheRikRoller25-03-2025

const puppeteer = require('puppeteer');
const fs = require('fs');
const ExcelJS = require('exceljs');

async function scrapePropertyNL() {
  // Stel de user agent en viewport in voor een desktop-achtige ervaring
  const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
  const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();
  await page.setUserAgent(ua);
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  
  // Ga naar de pagina met de bloglijst (pas deze URL aan naar jouw website)
  await page.goto('https://propertynl.com/Nieuws/Categorie/Transacties/15/50', { waitUntil: 'networkidle2' });
  
  // Wacht tot de container met de blogposts zichtbaar is
  await page.waitForSelector('ul.blog.big');
  console.log("Bloglijstpagina geladen");

  // Verzamel alle "Lees verder" links uit de blogposts
  const articleLinks = await page.evaluate(() => {
    const links = [];
    // Selecteer alle anchors met de class "read_more" binnen de container "ul.blog.big"
    document.querySelectorAll('ul.blog.big li.post a.read_more').forEach(anchor => {
      links.push(anchor.href);
    });
    return links;
  });
  
  console.log("Gevonden artikel links:", articleLinks);

  // Array om de gescrapete artikelen op te slaan
  const articles = [];

  // Loop over elke artikel link en scrape de detailpagina
  for (const link of articleLinks) {
    console.log("Navigeren naar artikel:", link);
    await page.goto(link, { waitUntil: 'networkidle2' });
    
    // Wacht tot de excerpt en de tekst beschikbaar zijn
    try {
      await page.waitForSelector('h3.excerpt', { timeout: 10000 });
      await page.waitForSelector('div.text', { timeout: 10000 });
    } catch (error) {
      console.error("Elementen niet gevonden op", link, error);
      continue; // Ga door naar het volgende artikel als er een probleem is
    }
    
    // Extraheer de titel (excerpt) en de content (beschrijving)
    const articleData = await page.evaluate(() => {
      const titleEl = document.querySelector('h3.excerpt p');
      const contentEl = document.querySelector('div.text');
      return {
        title: titleEl ? titleEl.innerText.trim() : '',
        content: contentEl ? contentEl.innerText.trim() : ''
      };
    });
    
    console.log("Gescraapt artikel:", articleData);
    articles.push({ url: link, ...articleData });
  }
  
  console.log("Alle artikelen:", articles);
  
  // Optioneel: sla de gescrapete data op als JSON
  const date = new Date().toJSON().slice(0,10);
  const jsonFilename = `propertyData_${date}.json`;
  fs.writeFileSync(`./scrapeData/${jsonFilename}`, JSON.stringify(articles, null, 2));
  console.log("JSON bestand opgeslagen:", jsonFilename);
  
  // Optioneel: zet de data om in een Excel-bestand
  /*
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Property Listings');
  worksheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Content', key: 'content', width: 60 },
    { header: 'URL', key: 'url', width: 50 }
  ];
  articles.forEach(article => {
    worksheet.addRow(article);
  });
  const excelFilename = `propertyData_${date}.xlsx`;
  await workbook.xlsx.writeFile(`./excelData/${excelFilename}`);
  console.log("Excel bestand aangemaakt:", excelFilename);
  */
  
  // Houd de browser open of sluit deze als je klaar bent
  // await browser.close();
  
  return "PropertyNL scraping voltooid!";
}

module.exports = {
  scrapePropertyNL
};

if (require.main === module) {
  scrapePropertyNL()
    .then(() => console.log("Proces voltooid."))
    .catch(err => console.error("Er ging iets mis:", err));
}
