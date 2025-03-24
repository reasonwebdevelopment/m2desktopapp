const btn = document.getElementById('btn');
// const propertynl = document.getElementById('propertynl'); // Gebruik dit indien nodig
const loader = document.getElementById('loader');
const statustext = document.getElementById('statustext');
const results = document.getElementById('results');
// information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`;

btn.addEventListener('click', () => {
    loader.classList.remove('hidden');
    func();
});

propertynl.addEventListener('click', () => {
    loader.classList.remove('hidden');
});

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

const func = async () => {
    const response = await window.versions.checkVastgoedmarkt();
    // Hier kun je eventueel extra logica toevoegen op basis van de response
};

const fs = window.electronFs;
const path = window.electronPath;

let currentDir = './scrapeData/';
let filesTable = document.getElementById('filesTable');

////////////////////////////////////////////////////
// Event Listeners voor directory navigatie

filesTable.addEventListener('dblclick', e => {
    let dirName = e.target.parentNode.getAttribute('dirName');
    if (dirName && dirName !== '') {
        scanDir(path.join(currentDir, dirName));
    }
});

document.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Backspace') {
        scanDir(path.join(currentDir, '..'));
    }
});

////////////////////////////////////////////////////
// Start de directory scan (optioneel, haal de commentaar weg als je dit wilt activeren)
// scanDir(currentDir);

////////////////////////////////////////////////////
// Functie om een directory te scannen en de bestanden te tonen

function scanDir(dir) {
    currentDir = dir;

    // Lees alle bestanden in de directory
    let files = fs.readdirSync(dir);

    // Verzamel details per bestand of map
    let filesStat = [];
    for (let i = 0; i < files.length; i++) {
        try {
            let name = files[i];
            let fullPath = path.join(dir, name);
            let stat = fs.statSync(fullPath);
            // Gebruik stat.isDirectory() in plaats van fs.isDirectory()
            let isDir = stat.isDirectory() ? 1 : 0;
            let mtime = fileDate(stat.mtime);
            let size = '';
            if (!isDir) size = bytesToSize(stat.size);
            // Sla alleen bestanden/mappen op die niet met een punt beginnen (verborgen)
            if (name.indexOf('.') !== 0) {
                filesStat.push({
                    name,
                    stat,
                    isDir,
                    mtime,
                    size
                });
            }
        } catch (error) {
            // Fout bij het ophalen van bestand info, sla over
        }
    }

    // Sorteer eerst op naam, vervolgens op type (directories eerst)
    filesStat.sort((a, b) => {
        let res = 0;
        if (b.name.toLowerCase() > a.name.toLowerCase()) res = -1;
        if (b.name.toLowerCase() < a.name.toLowerCase()) res = 1;
        return res;
    });
    filesStat.sort((a, b) => {
        return b.isDir - a.isDir;
    });

    // Bouw de HTML-tabel voor de bestanden/mappen
    let list = '<table class="w-full">';
    list += `
    <thead>
        <tr>
            <th class="text-left">Name</th>
            <th class="text-left">Date modified</th>
            <th class="text-left">Size</th>
        </tr>
    </thead>
    `;

    for (let i = 0; i < filesStat.length; i++) {
        let f = filesStat[i];
        list += `
        <tr dirName="${f.isDir ? f.name : ''}" draggable="true">
            <td>
                ${f.isDir ? '&#128193;' : '&#128452;'} ${f.name}
            </td>
            <td>
                ${f.mtime}
            </td>
            <td class="size">
                ${f.size}
            </td>
        </tr>
        `;
    }

    list += '</table>';

    // Plaats de tabel in het DOM
    filesTable.innerHTML = list;
}

///////// Helper functies

function bytesToSize(bytes, seperator = " ") {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    if (i === 0) return `${bytes}${seperator}${sizes[i]}`;
    return `${(bytes / (1024 ** i)).toFixed(1)}${seperator}${sizes[i]}`;
}

function fileDate(ms) {
    // Let op: ms.getMonth() geeft 0-11, dus indien gewenst +1 toevoegen
    let res = ms.getFullYear() +
        '-' + leadZeroDate(ms.getMonth() + 1) +
        '-' + leadZeroDate(ms.getDate()) +
        ', ' + ms.toLocaleTimeString();
    return res;
}

function leadZeroDate(num) {
    return num < 10 ? `0${num}` : num;
}
