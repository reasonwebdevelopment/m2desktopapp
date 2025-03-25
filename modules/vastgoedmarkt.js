const puppeteer = require("puppeteer");
const fs = require('fs');
const ExcelJS = require('exceljs');
const { shell } = require('electron');
const date = new Date().toJSON().slice(0, 10);

async function scrapeVastgoedmarkt(win) {
    console.log("Starting Vastgoedmarkt scraping...");
    // Puppeteer launch
    const ua = "Mozilla/5.0 (X11; Linux x86_64)...";
    const browser = await puppeteer.launch({ headless: false, slowMo: 50 }); // slowMo helps you observe actions
    const page = await browser.newPage();
    console.log("New page created.");

    await page.setUserAgent(ua);
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    const analyseArticles = [];
    const importArticles = [];

    await page.goto('https://www.vastgoedmarkt.nl/transacties');

    /**********  
     * Login procedure and navigation
     **********/
    await page.waitForSelector('#didomi-notice-agree-button'); 
    await page.click('#didomi-notice-agree-button');

    await page.waitForSelector('.vmn-login');
    await page.click('.vmn-login');

    await page.waitForTimeout(1000);

    await page.waitForSelector('#enterEmail_email');
    await page.type('#enterEmail_email', 'michiel@m2realestate.nl');

    await page.click('#enterEmail_next');

    await page.waitForTimeout(2000);

    await page.waitForSelector('input#login-password_password');
    await page.type('input#login-password_password', 'Micatolo18');

    await page.click('#login-password_next');

    await page.waitForSelector('section[type="articles_summaries"]:first-child');
    await page.click('section[type="articles_summaries"]:first-child .head a');

    /**********
     * Retrieve list of articles and filter interesting ones
     **********/
    await page.waitForSelector('.button.passive-arrow');

    let iteratie = 0;
    const nrIteraties = 15;

    async function getArticles() {
        iteratie += 1;

        const ArticleResults = await page.evaluate(() => {
            const articles = document.querySelectorAll(".summary");
            return Array.from(articles).map(article => {
                const url = article.href;
                const title = article.querySelector(".title h2").innerText;
                return { title, url };
            });
        });

        console.log('------- Iteratie: ' + iteratie);

        // Send status updates to the renderer window
        switch (iteratie) {
            case 1:
                win.webContents.send('update-status', 'Verkochte objecten ophalen...');
                break;
            case 2:
                win.webContents.send('update-status', 'Oppervlakte aan het berekenen...');
                break;
            case 3:
                win.webContents.send('update-status', 'Bestemmingsplannen aan het wijzigen...');
                break;
            case 4:
                win.webContents.send('update-status', 'OZB aan het berekenen...');
                break;
            case 5:
                win.webContents.send('update-status', 'Koeien van het terrein aan het halen...');
                break;
            case 6:
                win.webContents.send('update-status', 'Grote spelers aan het dwarsbomen...');
                break;
            case 7:
                win.webContents.send('update-status', 'Deeltjes aan het versnellen...');
                break;
            case 8:
                win.webContents.send('update-status', 'Atomen aan het splitten...');
                break;
            case 9:
            case 10:
                win.webContents.send('update-status', 'Verkochte objecten ophalen...');
                break;
            case 11:
                win.webContents.send('update-status', 'Ammo aan het pakken...');
                break;
            case 12:
                win.webContents.send('update-status', 'Aan het reloaden...');
                break;
            case 13:
                win.webContents.send('update-status', 'Winner, winner, chicken dinner...');
                break;
            case 14:
                win.webContents.send('update-status', 'Enemies met koekenpan aan het slaan...');
                break;
        }

        if (iteratie <= nrIteraties) {
            for (let i = 0; i < ArticleResults.length; i++) {
                if (
                    ArticleResults[i].title.includes("DC") ||
                    ArticleResults[i].title.includes("dc") ||
                    ArticleResults[i].title.includes("koopt")
                ) {
                    console.log('Interessante artikel -> Array');
                    analyseArticles.push(ArticleResults[i].url);
                }

                if (i === ArticleResults.length - 1) {
                    console.log('Door naar volgende pagina ->');
                    await page.click('.button.passive-arrow:last-child');
                    await page.waitForTimeout(5000);
                    // Recursively retrieve the next set of articles
                    ArticleResults.concat(await getArticles());
                }
            }
        } else {
            console.log('Analyseer nu alle links');
            for (let i = 0; i < analyseArticles.length; i++) {
                win.webContents.send('update-status', 'Schaapjes tellen: ' + i + ' schaapje(s)');
                await page.goto(analyseArticles[i]);
                await page.waitForSelector('.types-article-content');
                const articleContent = await page.evaluate(() => {
                    const title = document.querySelector('p[type="article_intro"]').innerText;
                    const content = document.querySelector('.types-article-content').innerText;
                    return { title, content };
                });
                importArticles.push(articleContent);
            }
        }

        // Write the collected data to a JSON file
        const json = JSON.stringify(importArticles, null, 2);
        const filename = 'nieuweData_' + date + '.json';
        fs.writeFile('./scrapeData/' + filename, json, (err) => {
            if (!err) {
                win.webContents.send('update-complete', true);
                // Optionally, convert JSON to Excel after a delay:
                // setTimeout(() => {
                //   getExcel(filename);
                // }, 5000);
            }
        });
    }

    // Start the article retrieval process
    await getArticles();
    return "Scraping complete!";
}

async function getExcel(filename) {
    const filePath = './scrapeData/' + filename;
    if (!fs.existsSync(filePath)) {
        console.error('File does not exist:', filePath);
        return;
    }
    let jsonData;
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        if (!fileContent) throw new Error('File content is empty');
        jsonData = JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
        return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Property Data');
    worksheet.columns = [
        { header: 'Transaction Type', key: 'transactionType', width: 15 },
        { header: 'Project', key: 'project', width: 30 },
        { header: 'Koper', key: 'koper', width: 30 },
        { header: 'Locatie', key: 'locatie', width: 30 },
        { header: 'Grootte', key: 'grootte', width: 15 },
        { header: 'Kosten', key: 'kosten', width: 15 },
    ];

    jsonData.forEach(item => {
        // Here you would extract and format the data as needed.
        // For demonstration, we'll add placeholder data:
        worksheet.addRow({
            transactionType: 'Unknown',
            project: item.title || 'Unknown',
            koper: 'Unknown',
            locatie: 'Unknown',
            grootte: 'Unknown',
            kosten: 'Unknown',
        });
    });

    const newexcelfile = 'nieuweData_' + date + '.xlsx';
    const outputFilePath = './excelData/' + newexcelfile;
    try {
        await workbook.xlsx.writeFile(outputFilePath);
        shell.openPath('./excelData/');
        shell.showItemInFolder(newexcelfile);
    } catch (err) {
        console.error('Error writing Excel file:', err);
    }
}

module.exports = {
    scrapeVastgoedmarkt,
    getExcel
};
