const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const keywords = [
    'DC', 'dc', 'koopt', 'koop', 'huur', 'huurt', 'aanhuur',
    'verkoop', 'verkoopt', 'verkocht', 'Verkocht',
    'Warehouse', 'warehouse', 'Bedrijfsruimte', 'bedrijfsruimte',
    'Logistiek', 'logistiek', 'Sale lease back', 'sale lease back',
    'Nieuwe gebruiker', 'nieuwe gebruiker', 'Sale', 'sale',
    'Purchase', 'purchase', 'Lease', 'lease', 'Leased', 'leased'
];

function getTimestampString() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

async function loginToLogistiek(page) {
    const email = process.env.LOG_EMAIL;
    const wachtwoord = process.env.LOG_PASSWORD;

    await page.goto('https://www.logistiek.nl', { waitUntil: 'networkidle2' });

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
    console.log('✅ Ingelogd op Logistiek.nl');
}


async function getArticleLinks(page, maxClicks = 5) {
    await page.goto('https://www.logistiek.nl/nieuws', { waitUntil: 'networkidle2' });

    for (let i = 0; i < maxClicks; i++) {
        try {
            await page.click('button.button--more.more');
            await new Promise(resolve => setTimeout(resolve, 3000));
        } catch {
            break;
        }
    }

    const links = await page.$$eval('ul.articles li a', anchors =>
        anchors.map(a => ({
            href: a.href,
            title: a.querySelector('h2')?.innerText || ''
        }))
    );

    return links;
}

async function scrapeArticleDetail(page, article) {
    try {
        await page.goto(article.href, { waitUntil: 'networkidle2' });
        await page.waitForSelector('div.column.article h1', { timeout: 5000 });

        const articleData = await page.evaluate(() => {
            const container = document.querySelector('div.column.article');
            if (!container) return null;
            const title = Array.from(container.querySelectorAll('h1, h2')).map(el => el.innerText.trim()).filter(Boolean);
            const content = Array.from(container.querySelectorAll('p')).map(el => el.innerText.trim()).filter(Boolean);
            return { title, content };
        });

        if (articleData) {
            articleData.url = article.href;
            return articleData;
        }
    } catch (err) {
        console.warn(`⚠️  Fout bij ${article.href}: ${err.message}`);
    }
    return null;
}

function exportToJson(data) {
    const timestamp = getTimestampString();
    const dir = path.join(__dirname, '../Transacties/LogistiekTransacties/JSON');
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `logistiek_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`💾 JSON opgeslagen op ${filePath}`);
    return filePath;
}

async function scrapeLogistiek() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        await loginToLogistiek(page);
        const links = await getArticleLinks(page);
        const data = [];

        for (let i = 0; i < links.length; i++) {
            const article = links[i];
            const matches = keywords.some(k => article.title.toLowerCase().includes(k.toLowerCase()));
            if (!matches) continue;

            const result = await scrapeArticleDetail(page, article);
            if (result) {
                data.push(result);
                console.log(`(${i + 1}/${links.length}) ✅ Gescrapet: ${result.title[0]}`);
            }
        }

        exportToJson(data);
    } catch (err) {
        console.error('❌ Fout tijdens scraping:', err.message);
    } finally {
        await browser.close();
    }
}

module.exports = {
    scrapeLogistiek,
    getTimestampString
};
