const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeLogistiek() {
    const email = 'vdbout@live.nl';
    const wachtwoord = 'M2realestatebv';

    const keywords = [
        'DC', 'dc', 'koopt', 'koop', 'huur', 'huurt', 'aanhuur',
        'verkoop', 'verkoopt', 'verkocht', 'Verkocht',
        'Warehouse', 'warehouse', 'Bedrijfsruimte', 'bedrijfsruimte',
        'Logistiek', 'logistiek', 'Sale lease back', 'sale lease back',
        'Nieuwe gebruiker', 'nieuwe gebruiker', 'Sale', 'sale',
        'Purchase', 'purchase', 'Lease', 'lease', 'Leased', 'leased'
    ];

    const browser = await puppeteer.launch({ headless: false, slowMo: 0 });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('[Scraper] Open homepage...');
    await page.goto('https://www.logistiek.nl', { waitUntil: 'networkidle2' });

    try {
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 5000 });
        await page.click('#didomi-notice-agree-button');
        console.log('[Scraper] Cookie banner gesloten');
    } catch {
        console.log('[Scraper] Geen cookie banner gevonden');
    }

    await page.waitForSelector('.vmn-login', { timeout: 10000 });
    await page.click('.vmn-login');

    await page.waitForSelector('#enterEmail_email', { visible: true });
    await page.type('#enterEmail_email', email);
    await page.click('#enterEmail_next');
    console.log('[Scraper] E-mail ingevoerd');

    await page.waitForTimeout(2000);
    await page.waitForSelector('input#login-password_password', { visible: true });
    await page.type('input#login-password_password', wachtwoord);
    await page.click('#login-password_next');
    console.log('[Scraper] Wachtwoord ingevoerd');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('[Scraper] Ingelogd');

    await page.goto('https://www.logistiek.nl/nieuws', { waitUntil: 'networkidle2' });

    for (let i = 0; i < 5; i++) {
        try {
            await page.waitForSelector('button.button--more.more', { timeout: 5000 });
            await page.click('button.button--more.more');
            console.log(`[Scraper] ⬇️ Meer nieuws geladen (${i + 1}/5)...`);
            await page.waitForTimeout(3000); // wacht 3 sec om extra artikelen te laden
        } catch {
            console.log('[Scraper] 🛑 Geen "Meer nieuws" knop meer beschikbaar');
            break;
        }
    }

    // Artiekel links opslaan in array.
    const articleLinks = await page.$$eval('ul.articles li a', anchors =>
        anchors.map(a => ({
            href: a.href,
            title: a.querySelector('h2')?.innerText || ''
        }))
    );

    console.log(`[Scraper] 🔗 ${articleLinks.length} artikel-links gevonden`);

   
    const scrapedArticles = [];

    for (const article of articleLinks) {
        const matchesKeyword = keywords.some(keyword => article.title.toLowerCase().includes(keyword.toLowerCase()));
        if (!matchesKeyword) {
            console.log(`⛔️ Overgeslagen: ${article.title}`);
            continue;
        }

        try {
            console.log(`✅ Scrapen: ${article.href}`);
            await page.goto(article.href, { waitUntil: 'networkidle2' });
            await page.waitForSelector('div.column.article h1', { timeout: 5000 });

            const articleData = await page.evaluate(() => {
                const container = document.querySelector('div.column.article');
                if (!container) return null;

                const titleElements = Array.from(container.querySelectorAll('h1, h2'));
                const paragraphElements = Array.from(container.querySelectorAll('p'));

                const title = titleElements.map(el => el.innerText.trim()).filter(Boolean);
                const content = paragraphElements.map(el => el.innerText.trim()).filter(Boolean);
                return { title, content };
            });

            if (articleData) {
                articleData.url = article.href;
                scrapedArticles.push(articleData);
            }

        } catch (err) {
            console.log(`⚠️ Fout bij ${article.href}: ${err.message}`);
        }
    }

    const outputPath = path.join(__dirname, 'logistiek_scrap.json');
    fs.writeFileSync(outputPath, JSON.stringify(scrapedArticles, null, 2), 'utf-8');
    console.log(`✅ ${scrapedArticles.length} interessante artikelen opgeslagen in ${outputPath}`);

    await browser.close();

    return {
        status: '✅ Alles klaar!',
        links: scrapedArticles.map(a => a.url)
    };
}

module.exports = {
    scrapeLogistiek,
};
