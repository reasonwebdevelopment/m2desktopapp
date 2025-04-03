const puppeteer = require('puppeteer');

async function scrapeLogistiek() {
    const email = 'vdbout@live.nl';
    const wachtwoord = 'M2realestatebv';

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('[Scraper] Open homepage...');
    await page.goto('https://www.logistiek.nl', { waitUntil: 'networkidle2' });

    // Cookie consent
    try {
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 5000 });
        await page.click('#didomi-notice-agree-button');
        console.log('[Scraper] Cookie banner gesloten');
    } catch {
        console.log('[Scraper] Geen cookie banner gevonden');
    }

    // Klik op 'Inloggen' (zelfde selector als Vastgoedmarkt)
    await page.waitForSelector('.vmn-login', { timeout: 10000 });
    await page.click('.vmn-login');
    await page.waitForTimeout(1000);

    // E-mail invoeren
    await page.waitForSelector('#enterEmail_email', { visible: true });
    await page.type('#enterEmail_email', email);
    await page.click('#enterEmail_next');
    console.log('[Scraper] E-mail ingevoerd');

    // Wachtwoord invoeren
    await page.waitForTimeout(2000);
    await page.waitForSelector('input#login-password_password', { visible: true });
    await page.type('input#login-password_password', wachtwoord);
    await page.click('#login-password_next');
    console.log('[Scraper] Wachtwoord ingevoerd');

    // Wachten op redirect naar ingelogde site
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('[Scraper] Ingelogd en terug op site');

    // Screenshot ter controle /// HAHAHA funny het maakt oprecht een screensh
    // await page.screenshot({ path: 'logistiek_ingelogd.png' });

    await browser.close();

    return { status: '✅ Ingelogd!' };
}

module.exports = {
    scrapeLogistiek,
};
