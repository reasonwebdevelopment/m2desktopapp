const { app, BrowserWindow, shell } = require('electron')
const path = require('node:path')
const { ipcMain } = require('electron');

const puppeteer = require("puppeteer");
const fs = require('fs');
const ExcelJS = require('exceljs');
const date = new Date().toJSON().slice(0,10);

let windows = new Set();

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            webviewTag:true
        }
    })
    windows.add(win)

    ipcMain.handle('checkVastgoedmarkt', async () => {
        await checkVgm()
    })

    async function checkVgm() {

        const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        await page.setUserAgent(ua);
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
          });
    
        const analyseArticles = Array();
        const importArticles = Array();
        
        await page.goto('https://www.vastgoedmarkt.nl/transacties');
    
        /***
        /* Login procedure en navigeren naar alle beleggingen 
        /****************************************************/
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

        // await page.click('.row-wrapper:nth-child[3] .column .head');
    
        // await page.waitForSelector('section[type="articles_list"]:last-child');
        // await page.click('section[type="articles_list"]:last-child .head a');
        // await page.waitForTimeout(2000);
        
        await page.waitForSelector('section[type="articles_summaries"]:first-child');
        await page.click('section[type="articles_summaries"]:first-child .head a');
    
    
        /***
        /* Haal lijst van artikelen op en kijk of er iets interessants tussen zit 
        /************************************************************************/
        await page.waitForSelector('.button.passive-arrow');
    
        let iteratie = 0;
        let nrIteraties = 15;
    
        async function getArticles() {
    
            iteratie += 1;
    
            const ArticleResults = await page.evaluate(() => {
                // Fetch the first element with class "article"
                const articles = document.querySelectorAll(".summary");
    
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
            } else if(iteratie == 11) {
                win.webContents.send('update-status', 'Ammo aan het pakken...');
            } else if(iteratie == 12) {
                win.webContents.send('update-status', 'Aan het reloaden...');
            } else if(iteratie == 13) {
                win.webContents.send('update-status', 'Winner, winner, chicken dinner...');
            } else if(iteratie == 14) {
                win.webContents.send('update-status', 'Enemies met koekenpan aan het slaan...');
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

                    win.webContents.send('update-status', 'Schaapjes tellen: '+i+' schaapje(s)');
                    
                    await page.goto(analyseArticles[i]);
    
                    await page.waitForSelector('.types-article-content');
    
                    // const Article = await page.evaluate(() => {
                            
                    //     const articles = document.querySelectorAll(".column.article");
                        
                    //     return Array.from(articles).map((article) => {
    
                    //         const title = article.querySelector('p[type="article_intro"]').innerText;
                    //         const content = article.querySelector('.types-article-content').innerText;
    
                    //         return { title, content };            
    
                    //     });
    
                    // });
    
                    // importArticles.push(Article);
                    const articleContent = await page.evaluate(() => {
                        const title = document.querySelector('p[type="article_intro"]').innerText;
                        const content = document.querySelector('.types-article-content').innerText;
    
                        return { title, content };            
                    });
    
                    importArticles.push(articleContent);
    
                }
    
            }
    
            var json = JSON.stringify(importArticles, null, 2);
            var filename = 'nieuweData_'+date+'.json';
            fs.writeFile('./scrapeData/'+filename, json, (err) => {
                if (!err) {

                    win.webContents.send('update-complete', true);

                    // setTimeout(function() {

                    //     getExcel(filename);
        
                    // }, 5000);
                }
            });

            // win.webContents.send('update-results', JSON.stringify(importArticles));

        }

        function getExcel(filename) {
            const filePath = './scrapeData/' + filename;
        
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.error('File does not exist:', filePath);
                return;
            }
        
            let jsonData;
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
        
                // Check if the file content is empty
                if (!fileContent) {
                    throw new Error('File content is empty');
                }
        
                jsonData = JSON.parse(fileContent);
            } catch (error) {
                console.error('Error reading or parsing JSON file:', error);
                return;
            }
        
            // Create a new Excel workbook and sheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Property Data');
        
            // Add header row
            worksheet.columns = [
                { header: 'Transaction Type', key: 'transactionType', width: 15 },  // New column for "verkocht" or "gekocht"
                { header: 'Project', key: 'project', width: 30 },
                { header: 'Koper', key: 'koper', width: 30 },
                { header: 'Locatie', key: 'locatie', width: 30 },
                { header: 'Grootte', key: 'grootte', width: 15 },
                { header: 'Kosten', key: 'kosten', width: 15 },
            ];
        
            // Function to extract data from the title, summary, or the rest of the content
            jsonData.forEach(item => {
                let project = item.title;  // This should be taken directly from the title
                let koper = 'Unknown', locatie = 'Unknown', grootte = 'Unknown', kosten = 'Unknown';
                let transactionType = 'Unknown';  // To store "verkocht" or "gekocht"
        
                // Process the content to extract the needed fields
                const content = item.content;
        
                // Determine if it's a sale (verkocht) or a purchase (gekocht)
                if (project.toLowerCase().includes('verkocht') || content.toLowerCase().includes('verkocht')) {
                    transactionType = 'Verkocht';
                } else if (
                    project.toLowerCase().includes('gekocht') || 
                    content.toLowerCase().includes('gekocht') || 
                    project.toLowerCase().includes('koopt') || 
                    content.toLowerCase().includes('koopt')
                ) {
                    transactionType = 'Gekocht';
                }
        
                // First, look for the summary section "\n\nIn het kort\n\n"
                const summaryMatch = content.match(/\n\nIn het kort\n\n(.*)/s);
                let summary = summaryMatch ? summaryMatch[1] : null;
        
                // Define regex for various Dutch price formats
                const priceRegex = /Koopprijs:\s*([^\n"]+)/i;
                const priceMatch = content.match(priceRegex);
        
                if (priceMatch) {
                    let price = priceMatch[1].trim();
                    // Normalize the price format
                    price = price.replace('.', '').replace(',', '.');
                    kosten = `${price} euros`;
                }
        
                if (summary) {
                    // Extract data from the summary
                    const koperMatch = summary.match(/Koper:\s*([A-Za-z\s&.]+)\n/);
                    const locatieMatch = summary.match(/Adres object.*?:\s*(.+?)\n/);
                    const grootteMatch = summary.match(/Oppervlakte object:\s*(\d+[\.,]?\d*)\s?(m2|m²|vierkante meter)/i);
        
                    koper = koperMatch ? koperMatch[1].trim() : koper;
                    locatie = locatieMatch ? locatieMatch[1].trim() : locatie;
                    grootte = grootteMatch ? `${grootteMatch[1].replace('.', ',')} m²` : grootte;  // Use a Dutch number format
                }
        
                // Fallback to the main content if necessary
                if (koper === 'Unknown') {
                    const koperMatch = content.match(/koper.*?([A-Za-z\s&]+)\./);
                    koper = koperMatch ? koperMatch[1].trim() : koper;
        
                    // Additional search for "koopt" to identify a buyer
                    if (koper === 'Unknown') {
                        const kooptMatch = content.match(/([A-Za-z\s&]+)\s+koopt/i);
                        koper = kooptMatch ? kooptMatch[1].trim() : koper;
                    }
                }
        
                if (locatie === 'Unknown') {
                    const locatieMatch = content.match(/Adres object.*?:\s*(.+?)\n/i);
                    locatie = locatieMatch ? locatieMatch[1].trim() : locatie;
                }
        
                // Search for size in various Dutch formats
                if (grootte === 'Unknown') {
                    const grootteMatch = content.match(/(\d+[\.,]?\d*)\s?(m2|m²|vierkante meter)/i);
                    grootte = grootteMatch ? `${grootteMatch[1].replace('.', ',')} m²` : grootte;
                }
        
                // Fallback to the title for price, buyer, location, or size if not found in content or summary
                if (koper === 'Unknown') {
                    const titleKoperMatch = project.match(/([A-Za-z\s&]+)\s+(verkoopt|koopt)/i);
                    koper = titleKoperMatch ? titleKoperMatch[1].trim() : koper;
                }
        
                if (locatie === 'Unknown') {
                    const titleLocatieMatch = project.match(/in\s([A-Za-z\s,]+)\./i);
                    locatie = titleLocatieMatch ? titleLocatieMatch[1].trim() : locatie;
                }
        
                if (grootte === 'Unknown') {
                    const titleGrootteMatch = project.match(/(\d+[\.,]?\d*)\s?(m2|m²|vierkante meter)/i);
                    grootte = titleGrootteMatch ? `${titleGrootteMatch[1].replace('.', ',')} m²` : grootte;
                }
        
                // Add row to Excel
                worksheet.addRow({
                    transactionType,  // Adding the transaction type (verkocht or gekocht)
                    project,
                    koper,
                    locatie,
                    grootte,
                    kosten,
                });
            });
        
            // Save the Excel file
            const newexcelfile = 'nieuweData_' + date + '.xlsx';
            const outputFilePath = './excelData/' + newexcelfile;
            workbook.xlsx.writeFile(outputFilePath).then(() => {
                
                shell.openPath('./excelData/');
                shell.showItemInFolder(newexcelfile);
        
            }).catch(err => {
                console.error('Error writing Excel file:', err);
            });
        }
            
        
        getArticles();
    
    }

    win.loadFile('index.html')
}

const createGPTWindow = () => {
    let window = new BrowserWindow()
    windows.add(window)
    window.loadURL('https://chat.openai.com/g/g-xziTKDpYL-m2-gpt');
}

app.whenReady().then(() => {
    createWindow()
    // createGPTWindow()

    app.isPackaged || require('electron-reloader')(module)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})