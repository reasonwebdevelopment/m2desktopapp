const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
require('dotenv').config();

// Vastgoedjournaal, vastgoed dropdown menu opties 
const CATEGORIES = [
    'Belegging, verhuurd bedrijfspand',
    'opslagruimte  ',
    'gem bedr/kant',
    'bedrijfspand',
    'Bedrijfsruimte',
    'belegging'
];

// Maakt een timestamp D-M-Y-U-M
function getTimestampString() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

// Login
async function loginToVastgoedjournaal(page) {
    const email = process.env.VJ_EMAIL;
    const wachtwoord = process.env.VJ_PASSWORD;
    try {
        console.log('Inloggen...');
        await page.goto('https://vastgoedjournaal.nl', { waitUntil: 'networkidle2' });
        await page.click('#user-menu > a');
        await page.waitForSelector('#form-login', { visible: true, timeout: 5000 });
        await page.type('#quick_email', email, { delay: 50 });
        await page.type('#quick_password', wachtwoord, { delay: 50 });

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('#btnLogin'),
        ]);

        if (page.url().includes('/dashboard') || !page.url().includes('/login')) {
            console.log('Ingelogd');
        } else {
            throw new Error('Login lijkt niet gelukt (geen redirect naar dashboard)');
        }
    } catch (err) {
        throw new Error('Inloggen mislukt. Controleer je .env en de site structuur. ' + err.message);
    }
}

// Haalt relevante transactie links op gebaseerd op de opgegeven categorieen
async function getTransactionLinks(page, category) {
    await page.goto('https://vastgoedjournaal.nl/vastgoedtransacties', { waitUntil: 'networkidle2' });
    await page.waitForSelector('select[name="soort"]');
    await page.select('select[name="soort"]', category);
    await page.click('button[type="submit"].btn-primary');
    // Wacht óf op navigatie óf op update van DOM (veilig fallback)
    try {
        await Promise.race([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }),
            page.waitForSelector('select[name="transactions_length"]', { timeout: 5000 }),
        ]);
    } catch {
        console.warn(`!!!!!geen navigatie of DOM-update na klikken voor categorie "${category}"`);
    }
    await page.waitForSelector('select[name="transactions_length"]');
    await page.select('select[name="transactions_length"]', '-1');
    // Probeer te wachten op minimaal 1 transactie — met timeout fallback
    try {
        await page.waitForFunction(() =>
            document.querySelectorAll('#transactions tbody tr').length > 0,
            { timeout: 5000 }
        );
    } catch (e) {
        console.warn(`Geen transacties zichtbaar na selectie van categorie "${category}"`);
        return [];
    }
    // Filteren op jaartallen
    const links = await filterTransactionLinksByYears(page, ['2025']);
    return links.map(url => ({ categorie: category, url }));
}

// Gaat naar transactie pagina en scraped data
async function scrapeTransactionDetail(page, url, categorie) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        const data = await page.evaluate(() => {
            const get = (label) => {
                const row = Array.from(document.querySelectorAll('table.transaction tr'))
                    .find(tr => tr.innerText.trim().startsWith(label));
                return row ? row.querySelectorAll('td')[1]?.innerText.trim() : 'onbekend';
            };
            return {
                adres: get('Adres:'),
                postcodePlaats: get('Postcode, plaats:'),
                gemeente: get('Gemeente:'),
                provincie: get('Provincie:'),
                oppervlakte: get('Totale oppervlakte (m2):') || get('Totale oppervlakte (m²):'),
                koopprijs: get('Koopprijs:'),
                koper: get('Koper/huurder:'),
                adviseur_koper: get('Adviseur koper/huurder:'),
                url: window.location.href
            };
        });

        const [postcode, plaats] = (data.postcodePlaats || '').split(',').map(p => p.trim());

        return {
            Object: categorie,
            Adres: `${data.adres}, ${postcode || ''} ${plaats || ''}, ${data.gemeente}, ${data.provincie}`,
            Grootte: data.oppervlakte + ' m²',
            Koper: data.koper !== 'onbekend' ? data.koper : data.adviseur_koper,
            Bedrag: data.koopprijs,
            'Artikel URL': data.url,
        };
    } catch (err) {
        console.warn(`FOUT bij ${url}: ${err.message}`);
        return null;
    }
}

// slaat scraped data op in json file 
function getJson(data) {
    const timestamp = getTimestampString();
    const exportDir = path.join(__dirname, '../VastgoedjournaalTransacties/JSON');
    fs.mkdirSync(exportDir, { recursive: true });

    const jsonPath = path.join(exportDir, `vastgoedjournaal_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`JSON opgeslagen op ${jsonPath}`);
    return jsonPath;
}
// slaat scraped data op in excel 
function getExcel(data) {
    const timestamp = getTimestampString();
    const exportDir = path.join(__dirname, '../VastgoedjournaalTransacties/Excel');
    fs.mkdirSync(exportDir, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Transacties');
    sheet.columns = [
        { header: 'Object', key: 'Object', width: 30 },
        { header: 'Adres', key: 'Adres', width: 50 },
        { header: 'Grootte', key: 'Grootte', width: 15 },
        { header: 'Koper', key: 'Koper', width: 40 },
        { header: 'Bedrag', key: 'Bedrag', width: 20 },
        { header: 'Artikel URL', key: 'Artikel URL', width: 60 },
    ];
    data.forEach(row => sheet.addRow(row));

    const excelPath = path.join(exportDir, `vastgoedjournaal_${timestamp}.xlsx`);
    return workbook.xlsx.writeFile(excelPath).then(() => {
        console.log(`Excel opgeslagen op ${excelPath}`);
        return excelPath;
    });
}

// filterd alleen een op gegeven jaartal 
async function filterTransactionLinksByYears(page, years) {
    return await page.$$eval('#transactions tbody tr', (rows, targetYears) => {
        return Array.from(rows)
            .filter(row => {
                const yearCell = row.querySelector('td');
                return yearCell && targetYears.includes(yearCell.textContent.trim());
            })
            .map(row => {
                const link = row.querySelector('a');
                return link?.href || null;
            })
            .filter(Boolean);
    }, years.map(String));
}

// Start het scraping process
async function scrapeVastgoedjournaal() {
    const browser = await puppeteer.launch({ headless: true});
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    try {
        await loginToVastgoedjournaal(page);
    } catch (err) {
        await browser.close();
        throw err;
    }
    const allLinks = [];
    for (const category of CATEGORIES) {
        const links = await getTransactionLinks(page, category);
        allLinks.push(...links);
        console.log(`${links.length} links verzameld voor categorie "${category}"`);
    }
    const allData = [];
    for (let i = 0; i < allLinks.length; i++) {
        const { categorie, url } = allLinks[i];
        const result = await scrapeTransactionDetail(page, url, categorie);
        if (result) {
            allData.push(result);
            console.log(`(${i + 1}/${allLinks.length}) Gescrapet: ${result.Adres}`);
        }
    }
    await browser.close();
    await getJson(allData);
    await getExcel(allData);
}

module.exports = {
    scrapeVastgoedjournaal,
    getExcel,
    getJson,
    getTimestampString,
    filterTransactionLinksByYears
};
