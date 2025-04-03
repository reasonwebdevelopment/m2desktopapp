const puppeteer = require('puppeteer');

async function scrapeLogistiek() {
    const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 50,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(ua);
    await page.setViewport({ width: 1920, height: 1080 });

    // Stap 1: Ga naar de homepage
    console.log('[Scraper] Open homepage...');
    await page.goto('https://www.logistiek.nl', { waitUntil: 'networkidle2' });
    try {
        console.log('[Scraper] Check op cookie banner...');
        await page.waitForSelector('#didomi-notice-agree-button', { timeout: 5000 });
        await page.click('#didomi-notice-agree-button');
        console.log('[Scraper] Cookie banner gesloten');
    } catch (e) {
        console.log('[Scraper] Geen cookie banner gevonden of timeout, ga door');
    }
    
    // Stap 2: Klik op 'Inloggen'
    console.log('[Scraper] Klik op login knop...');
    await page.waitForSelector('a[href^="https://www.logistiek.nl/auth/redirect"]');
    await page.click('a[href^="https://www.logistiek.nl/auth/redirect"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Stap 3: Vul e-mailadres in
    console.log('[Scraper] Vul e-mailadres in...');
    await page.waitForSelector('input#enterEmail_email');
    await page.type('input#enterEmail_email', 'test@email.com');

    // Enable de knop
    await page.evaluate(() => {
        const btn = document.querySelector('#enterEmail_next');
        if (btn) btn.removeAttribute('disabled');
    });

    // Klik op "Ga verder"
    await page.click('#enterEmail_next');

    // Let op: je krijgt hierna waarschijnlijk een redirect naar een extern login-systeem
    // zoals Azure AD, SURFconext, of eigen accountomgeving.
    // De afhandeling daarvan moet handmatig of via cookies/sessies.
    await page.waitForTimeout(5000); // wacht voor debug, of voeg extra stappen toe

    await browser.close();
    return { status: 'Login flow triggered (verder automatiseren mogelijk met credentials of sessie)' };
}

module.exports = {
    scrapeLogistiek,
};
