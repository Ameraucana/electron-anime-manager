module.exports = class Media {
    constructor(element) {

        this.id = element.media.id;
        this.status = element.media.status;
        this.coverImage = element.media.coverImage.large;
        this.title = element.media.title.romaji;
        this.currentEpisode = element.progress;
        
        if(this.status !== "NOT_AIRED_YET") {
            this.totalEpisodes = element.media.episodes;
        }

        /*TODO set this.nickname to nickname column of name row (where name = title)
            *connection.get("SELECT FROM namesNicknames WHERE nickname=?", [this.title])
        */
    }

    get htmlString() {
        let episodeString;
        switch(this.status) {
            case "RELEASING":
                episodeString = this.totalEpisodes 
                    ? `${this.currentEpisode}/${this.totalEpisodes}` 
                    : `${this.currentEpisode}`;
                break;
            case "FINISHED":
                episodeString = `<span id="not-airing-span">FINISHED</span> | ${this.currentEpisode}/${this.totalEpisodes}`;
                break;
            case "NOT_YET_RELEASED":
                episodeString = "<span id='not-airing-span'>UNRELEASED</span>";
                break;
            default:
                episodeString = "";
                break;
        }
        return `<div class="list-item">
                    <img class="list-item-img" src="${this.coverImage}">
                    <div class="list-item-bar">
                        <div class="list-item-bar-right-inside">
                            <div id="name-nickname">
                                <input id="${this.id}" class="nickname-field" value="${this.nickname ? this.nickname : this.title}"></input>
                                <button id="${this.id}" class="reset-button">Reset</button>
                            </div>
                            <p id="episodes-p">${episodeString}</p>
                        </div>
                    </div>
                </div>`
    }

}