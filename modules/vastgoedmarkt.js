const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const KEYWORDS = [
    'DC', 'dc', 'koopt', 'koop', 'huur', 'huurt', 'aanhuur',
    'verkoop', 'verkoopt', 'verkocht', 'Verkocht',
    'Warehouse', 'warehouse', 'Bedrijfsruimte', 'bedrijfsruimte',
    'Logistiek', 'logistiek', 'Sale lease back', 'sale lease back',
    'Nieuwe gebruiker', 'nieuwe gebruiker', 'Sale', 'sale',
    'Purchase', 'purchase', 'Lease', 'lease', 'Leased', 'leased'
];

//Wacht-hulpfunctie (vervanging voor page.waitForTimeout)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Timestamp voor bestandsnamen
function getTimestampString() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

function matchesKeywords(text) {
    return KEYWORDS.some(k => text.toLowerCase().includes(k.toLowerCase()));
}

// Login op Vastgoedmarkt
async function loginToVastgoedmarkt(page) {
    const email = process.env.VGM_EMAIL;
    const wachtwoord = process.env.VGM_PASSWORD;

    await page.goto('https://www.vastgoedmarkt.nl/transacties', { waitUntil: 'networkidle2' });

    // Cookie banner sluiten indien aanwezig
    try {
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 5000 });
        await page.click('#didomi-notice-agree-button');
    } catch { }

    // Klik op login-knop
    await page.waitForSelector('.vmn-login', { visible: true });
    await page.click('.vmn-login');

    // Vul e-mailadres in
    await page.waitForSelector('#enterEmail_email', { visible: true });
    await page.type('#enterEmail_email', email);

    // Forceer frontend-validatie zodat knop activeert
    await page.evaluate(() => {
        const input = document.querySelector('#enterEmail_email');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Wacht tot knop actief wordt en klik
    await page.waitForFunction(() => {
        const btn = document.querySelector('#enterEmail_next');
        return btn && !btn.disabled;
    }, { timeout: 5000 });
    await page.click('#enterEmail_next');

    // Vul wachtwoord in
    await page.waitForSelector('#login-password_password', { visible: true });
    await page.type('#login-password_password', wachtwoord);

    // Klik op inloggen
    await page.waitForFunction(() => {
        const btn = document.querySelector('#login-password_next');
        return btn && !btn.disabled;
    }, { timeout: 5000 });
    await page.click('#login-password_next');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Ingelogd op Vastgoedmarkt.nl');
}

function isArticleFromPreviousMonth(datetimeStr) {
    const pubDate = new Date(datetimeStr);
    const now = new Date();

    const vorigeMaand = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const vorigJaar = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    return pubDate.getMonth() === vorigeMaand && pubDate.getFullYear() === vorigJaar;
}


// Haalt relevante artikelen op basis van keywords
async function getTransactionLinks(page) {
    const links = [];
    let foundAnyFromPreviousMonth = false;
    await page.waitForSelector('section[type="articles_summaries"]:first-child');
    await page.click('section[type="articles_summaries"]:first-child .head a');
    await page.waitForSelector('.button.passive-arrow');
    let pageCounter = 1;
    while (true) {
        const pageLinks = await page.$$eval('.summary', nodes => {
            return nodes.map(node => {
                const title = node.querySelector(".title h2")?.innerText || '';
                const url = node.href;
                const timeEl = node.querySelector('time');
                const datetime = timeEl?.getAttribute('datetime') || '';
                return { title, url, datetime };
            });
        });
        console.log(`🕒 Artikelen gevonden op pagina ${pageCounter}:`);
        pageLinks.forEach(link => {
            console.log(`- ${link.datetime} | ${link.title}`);
        });
        const relevant = pageLinks.filter(link => isArticleFromPreviousMonth(link.datetime));
        if (relevant.length > 0) {
            foundAnyFromPreviousMonth = true;
            links.push(...relevant);
            console.log(`📄 Pagina ${pageCounter}: ${relevant.length} artikelen van vorige maand toegevoegd`);
        } else if (foundAnyFromPreviousMonth) {
            console.log(`🛑 Geen artikelen meer van vorige maand op pagina ${pageCounter}, stoppen...`);
            break;
        }
        const nextButton = await page.$('.button.passive-arrow:last-child');
        if (!nextButton) {
            console.log("⛔️ Geen 'volgende' knop meer gevonden, einde bereikt.");
            break;
        }
        await nextButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        pageCounter++;
    }
    console.log(`📦 Totaal verzameld: ${links.length} artikelen van vorige maand`);
    return links;
}

// Scrape detaildata van elk artikel
async function scrapeTransactionDetail(page, link) {
    try {
        await page.goto(link.url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.types-article-content', { timeout: 5000 });

        const result = await page.evaluate(() => {
            const titleEl = document.querySelector('p[type="article_intro"]');
            const contentEl = document.querySelector('.types-article-content');
            return {
                title: titleEl?.innerText?.trim() || '',
                content: contentEl?.innerText?.trim() || ''
            };
        });
        const combinedText = `${result.title}\n${result.content}`;
        if (!matchesKeywords(combinedText)) {
            console.log(`🚫 Overgeslagen (geen keyword in titel of inhoud): ${link.title}`);
            return null;
        }
        return {
            ...result,
            url: link.url
        };
    } catch (err) {
        console.warn(`⚠️  Fout bij ${link.url}: ${err.message}`);
        return null;
    }
}

// JSON-export
function exportToJson(data) {
    const timestamp = getTimestampString();
    const dir = path.join(__dirname, '../Transacties/VastgoedmarktTransacties/JSON');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `vastgoedmarkt_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`JSON opgeslagen op ${filePath}`);
    return filePath;
}

// Main functie
async function scrapeVastgoedmarkt() {
    const browser = await puppeteer.launch({ headless: false, slowMo: 50 });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        await loginToVastgoedmarkt(page);
        const allLinks = await getTransactionLinks(page); // Alleen artikelen van vorige maand
        console.log(`📅 In totaal ${allLinks.length} artikelen van vorige maand gevonden`);
        const data = [];
        let overgeslagen = 0;
        const messages = {
            1: 'Verkochte objecten ophalen...',
            2: 'Oppervlakte aan het berekenen...',
            3: 'Bestemmingsplannen aan het wijzigen...',
            4: 'OZB aan het berekenen...',
            5: 'Koeien van het terrein aan het halen...',
            6: 'Grote spelers aan het dwarsbomen...',
            7: 'Deeltjes aan het versnellen...',
            8: 'Atomen aan het splitten...',
            11: 'Ammo aan het pakken...',
            12: 'Aan het reloaden...',
            13: 'Winner, winner, chicken dinner...',
            14: 'Enemies met koekenpan aan het slaan...'
        };
        for (let i = 0; i < allLinks.length; i++) {
            const message = messages[i + 1];
            if (message) console.log(message);
            const result = await scrapeTransactionDetail(page, allLinks[i]);
            if (result) {
                data.push(result);
                console.log(`(${data.length}/${allLinks.length}) Gescrapet: ${result.title}`);
            } else {
                overgeslagen++;
                console.log(`🚫 Overgeslagen (${i + 1}/${allLinks.length}): ${allLinks[i].title}`);
            }
        }
        exportToJson(data);
        console.log(`\n✅ Gescrapet: ${data.length} artikelen`);
        console.log(`🚫 Overgeslagen (geen keyword): ${overgeslagen} artikelen`);
        console.log(`📦 Totaal verwerkt (vorige maand): ${allLinks.length} artikelen`);
    } catch (err) {
        console.error('❌ Fout tijdens scraping:', err.message);
    } finally {
        await browser.close();
    }
}

module.exports = {
    scrapeVastgoedmarkt,
    getTimestampString
};
