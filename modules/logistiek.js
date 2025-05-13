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

function isArticleFromPreviousMonth(datetimeStr) {
    const pubDate = new Date(datetimeStr);
    const now = new Date();
    const vorigeMaand = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const vorigJaar = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return pubDate.getMonth() === vorigeMaand && pubDate.getFullYear() === vorigJaar;
}

function getPreviousMonthFilename() {
    const now = new Date();
    const maanden = [
        "januari", "februari", "maart", "april", "mei", "juni",
        "juli", "augustus", "september", "oktober", "november", "december"
    ];
    const maand = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const jaar = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return `logistiek_${maanden[maand]}_${jaar}.json`;
}

function matchesKeywords(text) {
    return keywords.some(k => text.toLowerCase().includes(k.toLowerCase()));
}

async function loginToLogistiek(page) {
    const email = process.env.LOG_EMAIL;
    const wachtwoord = process.env.LOG_PASSWORD;

    await page.goto('https://www.logistiek.nl', { waitUntil: 'networkidle2' });

    try {
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 5000 });
        await page.click('#didomi-notice-agree-button');
    } catch { }

    await page.waitForSelector('.vmn-login', { visible: true });
    await page.click('.vmn-login');

    await page.waitForSelector('#enterEmail_email', { visible: true });
    await page.type('#enterEmail_email', email);
    await page.evaluate(() => {
        const input = document.querySelector('#enterEmail_email');
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await page.waitForFunction(() => {
        const btn = document.querySelector('#enterEmail_next');
        return btn && !btn.disabled;
    });
    await page.click('#enterEmail_next');

    await page.waitForSelector('#login-password_password', { visible: true });
    await page.type('#login-password_password', wachtwoord);

    await page.waitForFunction(() => {
        const btn = document.querySelector('#login-password_next');
        return btn && !btn.disabled;
    });
    await page.click('#login-password_next');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('Ingelogd op Logistiek.nl');
}

async function getArticleLinks(page) {
    await page.goto('https://www.logistiek.nl/nieuws', { waitUntil: 'networkidle2' });

    const links = [];
    const seen = new Set();
    let foundAnyFromPreviousMonth = false;
    let pageCounter = 1;

    while (true) {
        await page.waitForSelector('.group-wrapper .group');

        const newLinks = await page.$$eval('.group', groups => {
            return groups.flatMap(group => {
                const articles = Array.from(group.querySelectorAll('ul.articles li a'));
                return articles.map(a => {
                    const title = a.querySelector('h2')?.innerText || '';
                    const href = a.href;
                    const datetime = a.querySelector('time')?.getAttribute('datetime') || '';
                    return { title, href, datetime };
                });
            });
        });

        const filtered = newLinks.filter(link => link.href && !seen.has(link.href) && link.datetime);
        filtered.forEach(link => seen.add(link.href));

        console.log(`Artikelen gevonden op pagina ${pageCounter}:`);
        filtered.forEach(link => console.log(`- ${link.datetime} | ${link.title}`));

        const relevant = filtered.filter(link => isArticleFromPreviousMonth(link.datetime));

        if (relevant.length > 0) {
            foundAnyFromPreviousMonth = true;
            links.push(...relevant);
            console.log(`Pagina ${pageCounter}: ${relevant.length} artikelen van vorige maand toegevoegd`);
        } else if (foundAnyFromPreviousMonth) {
            console.log(`Geen nieuwe artikelen van vorige maand op pagina ${pageCounter}, stoppen...`);
            break;
        }

        const loadMoreButton = await page.$('button.button--more.more');
        if (!loadMoreButton) {
            console.log("Geen 'meer laden' knop meer beschikbaar.");
            break;
        }

        await loadMoreButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        pageCounter++;
    }

    console.log(`Totaal verzameld: ${links.length} artikelen van vorige maand`);
    return links;
}

async function scrapeArticleDetail(page, article) {
    try {
        await page.goto(article.href, { waitUntil: 'networkidle2' });
        await page.waitForSelector('div.column.article h1', { timeout: 5000 });

        const result = await page.evaluate(() => {
            const container = document.querySelector('div.column.article');
            if (!container) return null;
            const title = Array.from(container.querySelectorAll('h1, h2')).map(el => el.innerText.trim()).filter(Boolean);
            const content = Array.from(container.querySelectorAll('p')).map(el => el.innerText.trim()).filter(Boolean);
            return { title, content };
        });

        if (!result) return null;

        const fullText = [...result.title, ...result.content].join('\n');
        if (!matchesKeywords(fullText)) {
            console.log(`Overgeslagen (geen keyword in titel of inhoud): ${article.title}`);
            return null;
        }

        return {
            title: result.title.join(' – '),
            content: result.content.join('\n\n'),
            url: article.href
        };
    } catch (err) {
        console.warn(`Fout bij ${article.href}: ${err.message}`);
        return null;
    }
}

function exportToJson(data) {
    const filename = getPreviousMonthFilename();
    const dir = path.join(__dirname, '../Transacties/LogistiekTransacties/JSON');
    fs.mkdirSync(dir, { recursive: true });
    const fullPath = path.join(dir, filename);
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2));
    console.log(`JSON opgeslagen op ${fullPath}`);
    return fullPath;
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
        let overgeslagen = 0;

        for (let i = 0; i < links.length; i++) {
            const result = await scrapeArticleDetail(page, links[i]);
            if (result) {
                data.push(result);
                console.log(`Gescrapet (${data.length}/${links.length}): ${result.title}`);
            } else {
                overgeslagen++;
                console.log(`Overgeslagen (${i + 1}/${links.length}): ${links[i].title}`);
            }
        }

        exportToJson(data);
        console.log(`Gescrapet: ${data.length}`);
        console.log(`Overgeslagen: ${overgeslagen}`);
        console.log(`Totaal van vorige maand: ${links.length}`);
    } catch (err) {
        console.error('Fout tijdens scraping:', err.message);
    } finally {
        await browser.close();
    }
}

module.exports = {
    scrapeLogistiek
};