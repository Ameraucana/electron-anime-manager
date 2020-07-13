const electron = require("electron");
const {app, BrowserWindow, shell, ipcMain} = electron;
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

let mainWindow;
app.allowRendererProcessReuse = true;

let databasePath = path.join(__dirname, "database.db");
let iconPath = path.join(__dirname, "icon.ico");

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        height: 650,
        width: 1000,
        resizable: false,
        title: "Anime",
        icon: iconPath,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    mainWindow.setMenu(null);
    mainWindow.on("ready-to-show", () => {
        mainWindow.show();
        mainWindow.focus();
    })
    mainWindow.on("closed", () => mainWindow = null)
    app.on("window-all-closed", () => app.quit());





    ipcMain.on("read-db", (_) => {
        const database = new sqlite3.Database(databasePath);
        database.serialize(() => {
            //makes table if necessary, then gets all rows
            database.run("CREATE TABLE IF NOT EXISTS namesNicknames(name TEXT UNIQUE, nickname TEXT, status TEXT);");
            database.all("SELECT name, nickname FROM namesNicknames", (err, rows) => {
                mainWindow.webContents.send("did-read-db", rows);
            });
        });
        database.close();
    });
    
    ipcMain.on("fill-db", (_, media, dbRows) => {
        //mediaNames is used later to see if each title in the database still remains online
        const mediaNames = [];
        const database = new sqlite3.Database(databasePath);
        database.serialize(() => {
            //adds new items to the database
            for (const id in media) {
                mediaNames.push(media[id]["title"]);
                database.run("INSERT OR IGNORE INTO namesNicknames(name, nickname, status) VALUES(?, ?, ?)", [media[id]["title"], media[id]["nickname"], media[id]["status"]]);
            }

            //removes old items from the database
            for (const obj of dbRows) {
                if(!(mediaNames.includes(obj["name"]))) {
                    database.run("DELETE FROM namesNicknames WHERE name=?", [obj["name"]]);
                }
            }

            //updates status
            for (const id in media) {
                database.run("UPDATE namesNicknames SET status=? WHERE name=?", [media[id]["status"], media[id]["title"]]);
            }
        });

        mainWindow.webContents.send("did-fill-db");
        database.close();
        console.log("CLOSED");
    });

    ipcMain.on("reset-nickname-db", (_, name) => {
        const database = new sqlite3.Database(databasePath);
        database.run("UPDATE namesNicknames SET nickname=NULL WHERE name=?", [name]);
        database.close();
    });

    ipcMain.on("go", (_) => {
        const database = new sqlite3.Database(databasePath);
        database.all("SELECT name, nickname FROM namesNicknames", (_, rows) => {
            const names = [];
            //replaces spaces with pluses to be put in search URL
            for (const row of rows) {
                let formatted;
                if(row.nickname) formatted = row.nickname.replace(/ /g, "+");
                else formatted = row.name.replace(/ /g, "+");
                names.push(formatted);
            }
            //opens each link
            for (const name of names) {
                shell.openExternal(`https://nyaa.si/?f=0&c=1_2&q=${name}`);
            }
        });
        database.close();
    });

    ipcMain.on("set-nickname-db", (_, name, nickname) => {
        const database = new sqlite3.Database(databasePath);
        database.run("UPDATE namesNicknames SET nickname=? WHERE name=?", [nickname, name]);
        database.close();
    });

    mainWindow.loadFile(path.join(__dirname, "html", "main_page.html"));
});