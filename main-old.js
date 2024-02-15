const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { ipcMain } = require('electron');

const puppeteer = require("puppeteer");
const fs = require('fs');
const date = new Date().toJSON().slice(0,10);

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        }
    })

    ipcMain.handle('checkVastgoedmarkt', async () => {
        await checkVgm()
    })

    async function checkVgm() {

        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
    
        const analyseArticles = Array();
        const importArticles = Array();
        
        await page.goto('https://www.vastgoedmarkt.nl/transacties');
    
        /***
        /* Login procedure en navigeren naar alle beleggingen 
        /****************************************************/
        await page.waitForSelector('#didomi-notice-agree-button');
        await page.click('#didomi-notice-agree-button');    
    
        await page.waitForSelector('#loginTop');
        await page.click('#loginTop');
    
        await page.waitForTimeout(1000);
        
        await page.waitForSelector('#enterEmail_email');
        await page.type('#enterEmail_email', 'michiel@m2realestate.nl');
        
        await page.click('#enterEmail_next');
        
        await page.waitForTimeout(2000);
    
        await page.waitForSelector('input#login-password_password');
        await page.type('input#login-password_password', 'Micatolo18');
    
        await page.click('#login-password_next');
    
        await page.waitForSelector('section[type="articles_list"]:last-child');
        await page.click('section[type="articles_list"]:last-child .head a');
    
    
        /***
        /* Haal lijst van artikelen op en kijk of er iets interessants tussen zit 
        /************************************************************************/
        await page.waitForSelector('.button.passive-arrow');
    
        let iteratie = 0;
        let nrIteraties = 8;
    
        async function getArticles() {
    
            iteratie += 1;
    
            const ArticleResults = await page.evaluate(() => {
                // Fetch the first element with class "article"
                const articles = document.querySelectorAll(".article");
    
                return Array.from(articles).map((article) => {
                    // Fetch the sub-elements from the previously fetched article element
                    // Get the displayed title and return it (`.innerText`)
                    const url = article.href;
                    const title = article.querySelector(".title h2").innerText;
            
                    return { title, url };
                });
    
            });
    
            console.log('------- Iteratie: '+iteratie);
            
            //LOADTEXTS
            if(iteratie == 1) {
                win.webContents.send('update-status', 'Verkochte objecten ophalen...');
            } else if(iteratie == 2) {
                win.webContents.send('update-status', 'Oppervlakte aan het berekenen...');
            } else if(iteratie == 3) {
                win.webContents.send('update-status', 'Bestemmingsplannen aan het wijzigen...');
            } else if(iteratie == 4) {
                win.webContents.send('update-status', 'OZB aan het berekenen...');
            } else if(iteratie == 5) {
                win.webContents.send('update-status', 'Koeien van het terrein aan het halen...');
            } else if(iteratie == 6) {
                win.webContents.send('update-status', 'Grote spelers aan het dwarsbomen...');
            } else if(iteratie == 7) {
                win.webContents.send('update-status', 'Deeltjes aan het versnellen...');
            } else if(iteratie == 8) {
                win.webContents.send('update-status', 'Atomen aan het splitten...');
            } else if(iteratie == 9) {
                win.webContents.send('update-status', 'Verkochte objecten ophalen...');
            } else if(iteratie == 10) {
                win.webContents.send('update-status', 'Verkochte objecten ophalen...');
            }

            // window.electronAPI.updateStatus('------- Iteratie: '+iteratie)
    
            if(iteratie <= nrIteraties) {
    
                for (let i = 0; i < ArticleResults.length; i++) {
    
                    if(ArticleResults[i].title.includes("DC")) {
                        console.log('Interessante "DC" artikel -> Array');
                        analyseArticles.push(ArticleResults[i].url);
                    } else if(ArticleResults[i].title.includes("dc")) { 
                        console.log('Interessante "dc" artikel -> Array');
                        analyseArticles.push(ArticleResults[i].url);
                    } else if(ArticleResults[i].title.includes("koopt")) {
                        //Hier ga je naar de pagina en zet je het artikel in de interessant array
                        // console.log('Gevonden: '+i);
                        console.log('Interessante "Koopt" artikel -> Array');
    
                        analyseArticles.push(ArticleResults[i].url);
            
                    }
    
                    if (i == (ArticleResults.length - 1)) {
                        //Hier is niets interessant en ga je naar de volgende pagina (alleen na het checken van alle items)    
                        console.log('Door naar volgende pagina ->');
        
                        await page.click('.button.passive-arrow:last-child');
        
                        await page.waitForTimeout(5000);
        
                        ArticleResults.concat(await getArticles());
        
                    }
    
                }
    
            } else {
    
                console.log('Analyseer nu alle links');
    
                for (let i = 0; i < analyseArticles.length; i++) {
                    
                    await page.goto(analyseArticles[i]);
    
                    await page.waitForSelector('.types-article-content');
    
                    const Article = await page.evaluate(() => {
                            
                        const articles = document.querySelectorAll(".column.article");
    
                        return Array.from(articles).map((article) => {
    
                            const title = article.querySelector('p[type="article_intro"]').innerText;
                            const content = article.querySelector('.types-article-content').innerText;
    
                            return { title, content };            
    
                        });
    
                    });
    
                    importArticles.push(Article);
    
                }
    
            }
    
            console.log(importArticles);
    
            var json = JSON.stringify(importArticles);
            fs.writeFile('./scrapeData/nieuweData_'+date+'.json', json, (err) => {
                if (!err) {
                    console.log('done');
                }
            });
    
        }
    
        getArticles();
    
    }

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})