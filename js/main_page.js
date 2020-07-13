//this script is run from main_page.html, so is technically located in /html
const Media = require('../js/classes/media.js'); 
const {ipcRenderer} = require("electron");

const mainBox = $("#main-box");

async function retrieve(){
    const query = `
        query ($userName: String) {
            Page {
                mediaList(userName:$userName, type: ANIME, status: CURRENT) {
                    progress
                    media {
                        id
                        episodes
                        status
                        coverImage {
                            large
                        }
                        title {
                            romaji
                        }
                    }
                }
            }
        }
    `;
    const variables = {
        userName: "Araucana"
    }
    const options = {
        method: "POST",
        headers: {
            "Content-type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            query: query,
            variables: variables,
        })
    }
    const response = await fetch("https://graphql.anilist.co", options);
    const jsonResponse = await response.json();
    if(response.ok) {
        return jsonResponse;
    } else {
        console.log("Error!");
        console.log(jsonResponse);
    }
}

retrieve().then((returnedObject) => {
    const media = {};
    const mediaList = returnedObject.data.Page.mediaList;

    //fills media object with key:pair -> id:Media
    mediaList.forEach( (element) => {
        const showInstance = new Media(element);
        media[element.media.id] = showInstance;
    });
    //reads database table
    ipcRenderer.send("read-db");
    //invoked after database table is read; is passed the table's contents
    ipcRenderer.once("did-read-db", (_, rows) => {
        for(const id in media) {
            rows.forEach( (row) => {
                //if the media object's name matches the table's and there is a nickname
                if(media[id]["title"] === row["name"] && row["nickname"]) {
                    //set media object's nickname to the table's; used for displaying 
                    media[id]["nickname"] = row["nickname"];
                }
            }) 
        }
        //add new items to database and remove old ones
        ipcRenderer.send("fill-db", media, rows);
    });
    
    ipcRenderer.once("did-fill-db", (_) => {
        //clears placeholder loading items
        $("#main-box").empty();
        //adds elements
        for (const id in media) {
            mainBox.append(media[id].htmlString);
        }

        $(".nickname-field").on("change", (event) => {
            //target is the element that was changed
            const target = $(event.target);
            const id = target.attr("id");
            const fieldVal = target.val().trim();
            media[id]["nickname"] = fieldVal;
            //trims the text of the field itself
            target.val(fieldVal);
            //sets anime's nickname to value of field
            ipcRenderer.send("set-nickname-db", media[id]["title"], media[id]["nickname"]);
        });

        $(".reset-button").on("click", (event) => {
            const target = $(event.target);
            const id = target.attr("id");
            media[id]["nickname"] = null;
            //visually resets nickname
            $(`input#${id}`).val(media[id]["title"]);
            //resets nickname in database table
            ipcRenderer.send("reset-nickname-db", media[id]["title"])
        });

        $("#go-button").on("click", (_) => ipcRenderer.send("go"));

    });
})