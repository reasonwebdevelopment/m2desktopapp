// Wrap everything inside DOMContentLoaded to ensure the elements exist
document.addEventListener('DOMContentLoaded', () => {
    // Grab the DOM elements
    const btnVastgoedmarkt = document.getElementById('btn');           // Button for Vastgoedmarkt
    const btnPropertynl = document.getElementById('propertynl');      // Button for PropertyNL
    const btnLogistiek = document.getElementById('btnLogistiek');
    const loader = document.getElementById('loader');
    const statustext = document.getElementById('statustext');
    const results = document.getElementById('results');
    const filesTable = document.getElementById('filesTable');

    // A generic function to run a scraper based on its name.
    async function runScraper(scraperName) {
        // Show the loader
        console.log("Renderer: runScraper aangeroepen met:", scraperName);
        loader.classList.remove('hidden');
        let response;
        try {
            if (scraperName === 'vastgoedmarkt') {
                console.log("Renderer: Invoking Vastgoedmarkt scraper");
                response = await window.versions.checkVastgoedmarkt();
            } else if (scraperName === 'propertynl') {
                console.log("Renderer: Invoking PropertyNL scraper");
                response = await window.versions.checkPropertyNL();
            } else if (scraperName === 'logistiek') {
                console.log("Renderer: Invoking Logistiek scraper");
                response = await window.versions.checkLogistiek(); // ✅ HIER
            } else {
                console.error("Renderer: Unknown scraper name:", scraperName);
                response = "Unknown scraper";
            }
            console.log("Renderer: Scraper response:", response);
        } catch (error) {
            console.error("Renderer: Error running scraper", error);
        } finally {
            // Hide the loader when done
            loader.classList.add('hidden');
        }
    }

    // Attach event listener for Vastgoedmarkt button
    if (btnVastgoedmarkt) {
        btnVastgoedmarkt.addEventListener('click', () => {
            runScraper('vastgoedmarkt');
        });
    }

    // Attach event listener for PropertyNL button, if it exists
    if (btnPropertynl) {
        btnPropertynl.addEventListener('click', () => {
            runScraper('propertynl');
        });
    }

    if (btnLogistiek) {
        btnLogistiek.addEventListener('click', () => {
            runScraper('logistiek');
        });
    }

    // Set up your IPC listeners for status updates and results
    window.electronAPI.onUpdateStatus((value) => {
        statustext.innerText = value;
        window.electronAPI.statusValue(value);
    });

    window.electronAPI.onResults((value) => {
        results.innerText = value;
        window.electronAPI.resultValue(value);
    });

    window.electronAPI.onGetDataComplete((value) => {
        if (value === true) {
            loader.classList.add('hidden');
        }
    });

    // Directory scanning functionality
    let currentDir = './scrapeData/';

    filesTable.addEventListener('dblclick', e => {
        let dirName = e.target.parentNode.getAttribute('dirName');
        if (dirName && dirName !== '') {
            scanDir(window.electronPath.join(currentDir, dirName));
        }
    });

    document.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Backspace') {
            scanDir(window.electronPath.join(currentDir, '..'));
        }
    });

    function scanDir(dir) {
        currentDir = dir;
        let files = window.electronFs.readdirSync(dir);
        let filesStat = [];
        for (let i = 0; i < files.length; i++) {
            try {
                let name = files[i];
                let fullPath = window.electronPath.join(dir, name);
                let stat = window.electronFs.statSync(fullPath);
                let isDir = stat.isDirectory() ? 1 : 0;
                let mtime = fileDate(stat.mtime);
                let size = '';
                if (!isDir) size = bytesToSize(stat.size);
                if (name.indexOf('.') !== 0) {
                    filesStat.push({ name, stat, isDir, mtime, size });
                }
            } catch (error) {
                // skip files that throw errors
            }
        }
        filesStat.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
        filesStat.sort((a, b) => b.isDir - a.isDir);

        let list = '<table class="w-full"><thead><tr>' +
            '<th class="text-left">Name</th>' +
            '<th class="text-left">Date modified</th>' +
            '<th class="text-left">Size</th>' +
            '</tr></thead>';
        filesStat.forEach(f => {
            list += `<tr dirName="${f.isDir ? f.name : ''}" draggable="true">
                   <td>${f.isDir ? '&#128193;' : '&#128452;'} ${f.name}</td>
                   <td>${f.mtime}</td>
                   <td class="size">${f.size}</td>
                 </tr>`;
        });
        list += '</table>';
        filesTable.innerHTML = list;
    }

    function bytesToSize(bytes, separator = " ") {
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 B';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
        return i === 0 ? `${bytes}${separator}${sizes[i]}` : `${(bytes / (1024 ** i)).toFixed(1)}${separator}${sizes[i]}`;
    }

    function fileDate(ms) {
        return ms.getFullYear() + '-' + leadZeroDate(ms.getMonth() + 1) +
            '-' + leadZeroDate(ms.getDate()) + ', ' + ms.toLocaleTimeString();
    }

    function leadZeroDate(num) {
        return num < 10 ? `0${num}` : num;
    }
});
