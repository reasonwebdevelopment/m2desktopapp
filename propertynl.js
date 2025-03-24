// propertyScraper.js

const puppeteer = require('puppeteer');
const fs = require('fs');
const ExcelJS = require('exceljs');

async function scrapePropertyNL() {
    // Stel de user agent en viewport in voor een desktop-achtige ervaring
    const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent(ua);
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    // Navigeer naar property.nl
    await page.goto('https://propertynl.com', { waitUntil: 'networkidle2' });
    console.log("Landed on property.nl");

    // Wacht 30 seconden zodat je de homepage kunt inspecteren
    await page.waitForTimeout(30000);

    // Als je na deze pauze wilt beginnen met scrapen, verwijder de commentaar op onderstaande code:

    /*
    // Wacht tot de listings geladen zijn (pas de selector aan indien nodig)
    await page.waitForSelector('.listing-item');
  
    // Haal alle listings op
    const listings = await page.evaluate(() => {
      const results = [];
      // Veronderstel dat elke listing een container heeft met de class 'listing-item'
      const items = document.querySelectorAll('.listing-item');
      items.forEach(item => {
        // Pas de selectors aan op basis van de werkelijke structuur van property.nl
        const title = item.querySelector('.listing-title') ? item.querySelector('.listing-title').innerText.trim() : '';
        const price = item.querySelector('.listing-price') ? item.querySelector('.listing-price').innerText.trim() : '';
        const location = item.querySelector('.listing-location') ? item.querySelector('.listing-location').innerText.trim() : '';
        const detailsUrl = item.querySelector('a') ? item.querySelector('a').href : '';
        results.push({ title, price, location, detailsUrl });
      });
      return results;
    });
  
    console.log('Scraped Listings:', listings);
  
    // Sla de data op als JSON
    const date = new Date().toJSON().slice(0,10);
    const jsonFilename = `propertyData_${date}.json`;
    fs.writeFileSync(`./scrapeData/${jsonFilename}`, JSON.stringify(listings, null, 2));
    console.log('JSON bestand opgeslagen:', jsonFilename);
  
    // Zet de data om in een Excel-bestand met ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Property Listings');
  
    worksheet.columns = [
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Price', key: 'price', width: 20 },
      { header: 'Location', key: 'location', width: 30 },
      { header: 'Details URL', key: 'detailsUrl', width: 40 }
    ];
  
    listings.forEach(listing => {
      worksheet.addRow(listing);
    });
  
    const excelFilename = `propertyData_${date}.xlsx`;
    await workbook.xlsx.writeFile(`./excelData/${excelFilename}`);
    console.log('Excel bestand aangemaakt:', excelFilename);
    */

    // Houd de browser open zodat je de pagina kunt bekijken of sluit deze indien gewenst:
    // await browser.close();
}

module.exports = {
    scrapePropertyNL
};

if (require.main === module) {
    scrapePropertyNL()
        .then(() => console.log("Proces voltooid."))
        .catch(err => console.error("Er ging iets mis:", err));
}
