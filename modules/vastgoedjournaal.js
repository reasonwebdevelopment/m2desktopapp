const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 🕒 Genereer timestamp voor bestandsnaam
function getTimestampString() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

// 🔐 Inloggen op vastgoedjournaal.nl
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
            console.log('✅ Ingelogd');
        } else {
            throw new Error('Login lijkt niet gelukt (geen redirect naar dashboard)');
        }
    } catch (err) {
        throw new Error('❌ Inloggen mislukt: ' + err.message);
    }
}

// 📅 Bepaal vorige maand en jaar
function getPreviousMonthAndYear() {
    const now = new Date();
    const vorigeMaand = now.getMonth(); // 0 = januari
    const jaar = vorigeMaand === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const maand = vorigeMaand === 0 ? 12 : vorigeMaand;
    return { maand, jaar };
}

function filterLinksByCurrentAndPreviousMonth(rawLinks) {
    const now = new Date();
    const huidigeMaand = now.getMonth() + 1;
    const huidigeJaar = now.getFullYear();
    const vorigeMaand = huidigeMaand === 1 ? 12 : huidigeMaand - 1;
    const vorigeJaar = huidigeMaand === 1 ? huidigeJaar - 1 : huidigeJaar;

    const maanden = {
        januari: 1, februari: 2, maart: 3, april: 4,
        mei: 5, juni: 6, juli: 7, augustus: 8,
        september: 9, oktober: 10, november: 11, december: 12
    };

    return rawLinks.filter(link => {
        const match = link.dateText?.match(/(\d{1,2}) (\w+) (\d{4})/);
        if (!match) return false;

        const [, , maandNaam, jaarText] = match;
        const maandGetal = maanden[maandNaam.toLowerCase()];
        const jaarGetal = parseInt(jaarText);

        return (
            (maandGetal === huidigeMaand && jaarGetal === huidigeJaar) ||
            (maandGetal === vorigeMaand && jaarGetal === vorigeJaar)
        );
    });
}

// 🔗 Verzamel artikel-links van logistiekpagina
async function getTransactionLinks(page, _category) {
    await page.goto('https://vastgoedjournaal.nl/logistiek', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#articles');
    // 🔁 Klik tot 5 keer op de knop "Meer artikelen laden..."
    for (let i = 0; i < 5; i++) {
        const knopZichtbaar = await page.$('#news_load_more');
        if (!knopZichtbaar) {
            console.log(`🔁 Stoppen met klikken: knop niet meer zichtbaar na ${i} keer.`);
            break;
        }
        console.log(`🔘 Klik ${i + 1}/5 op 'Meer artikelen laden...'`);
        await page.evaluate(() => {
            document.querySelector('#news_load_more').click();
        });
        // wacht 1.5 sec
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 📄 Verzamel alle links na het laden
    const rawLinks = await page.$$eval('#articles a', anchors =>
        anchors
            .filter(a => a.querySelector('article'))
            .map(a => {
                const dateText = a.querySelector('p.time')?.innerText?.trim() || '';
                return {
                    url: a.href,
                    dateText
                };
            })
    );
    // 📅 Filter op vorige én huidige maand
    const filtered = filterLinksByCurrentAndPreviousMonth(rawLinks);
    return filtered.map(link => ({ url: link.url }));
}

// 📰 Scrape artikelpagina (titel + inhoud)
async function scrapeTransactionDetail(page, url) {
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.article_view');

        const data = await page.evaluate(() => {
            const title = document.querySelector('h1')?.innerText?.trim() || '';
            const paragraphs = Array.from(document.querySelectorAll('.article_view p'))
                .map(p => p.innerText.trim())
                .filter(p => p.length > 0);
            const content = paragraphs.join('\n\n');
            return { title, content };
        });

        return {
            title: data.title,
            content: data.content,
            url: url
        };
    } catch (err) {
        console.warn(`❌ Fout bij ${url}: ${err.message}`);
        return null;
    }
}

// 💾 Sla resultaat op als JSON
function getJson(data) {
    const timestamp = getTimestampString();
    const exportDir = path.join(__dirname, '../Transacties/VastgoedjournaalTransacties/JSON');
    fs.mkdirSync(exportDir, { recursive: true });

    const jsonPath = path.join(exportDir, `vastgoedjournaal_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    console.log(`✅ JSON opgeslagen op: ${jsonPath}`);
    return jsonPath;
}

// 🚀 Hoofdproces
async function scrapeVastgoedjournaal() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        await loginToVastgoedjournaal(page);

        const links = await getTransactionLinks(page);
        console.log(`${links.length} artikelen gevonden.`);

        const allData = [];
        for (let i = 0; i < links.length; i++) {
            const { url } = links[i];
            const result = await scrapeTransactionDetail(page, url);
            if (result) {
                allData.push(result);
                console.log(`(${i + 1}/${links.length}) Gescrapet: ${result.title}`);
            }
        }

        getJson(allData);
    } catch (err) {
        console.error('❌ Fout tijdens scraping:', err.message);
    } finally {
        await browser.close();
    }
}

// 📦 Exporteerbare functies
module.exports = {
    scrapeVastgoedjournaal,
    getJson,
    getTimestampString
};
