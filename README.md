![Banner](https://i.pinimg.com/1200x/77/e5/c5/77e5c5b3543c4312a06d8279aa0add6a.jpg)

# Hindi Anime API

> A simple API for accessing Hindi anime content.

---



>## 📌 About
This API does not host or store any files on its own server.  
It only provides access to publicly available resources.

---

>## ⚠️ Disclaimer
This project is developed strictly for **educational purposes**.  
The repository owner is not responsible for any misuse or illegal activities performed using this API.

---
> ## 📚 Table of Contents
- [Installation](#Installation)
    - [Local Installation ](#local-installation)
- [Deployment](#deployment)
    - [Render](#render)
    - [Vercel](#vercel)
- [Documentation](#documentation)
    - [Home](#home)
    - [search](#search)
    - [Recently added episodes](#recently-added-episodes)
    - [Specific Anime Info](#specific-anime-info)
    - [Episodes](#episodes)
    - [Series](#series)
    - [Movies](#movies)
    - [Random Series](#random-series)
    - [Random Movies](#random-movies)
    - [Animes](#anime)
    - [Cartoons](#cartoons)
    - [Networks](#networks)
    - [Genres](#genre)
    - [Languages](#languages)
    - [Schedule](#schedule)
    - [Anime Stream Info](#anime-stream-info)
    - [Movies Details Ans stream](#movies-info)
    - [Alternative Stream Info](#alternative-stream-info)
    - [Downloads](#downloads)

> # Installation

## Local installation

1. Make sure you have Node.js installed on your local machine.

```bash
#For termux
pkg install node
#For linux
apt install node
```

2. Run the following code to clone the repository and install all required dependencies

```bash
#Cloning the repo
git clone https://github.com/Prathmesh6968/anime-api.git

cd anime-api
#Istalling all dependencies
npm i

#Run the Project
npm start
```

> # Deployment

### Render

Host your own instance of anime-api on Render.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Prathmesh6968/anime-api.git)

### Vercel

1. Fork this repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add the following environment variables:

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | Your Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Your Upstash Redis REST Token |

4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Prathmesh6968/anime-api)



> # Documentation

### Home

```bash
GET /api/
```

### 🔗 Endpoint

```bash
/api
```

> #### No parameter required ❌

#### Example of request

```javascript
import axios from "axios";
const resp = await axios.get("/api");
console.log(resp.data);
```
```javascript
Updating soon.......
```

### Search

```bash
GET /api/stream
```

### 🔗 Endpoint

```bash
/api/search?s={string}&page={Number}
```

#### Parameters

| Parameter | Parameter-Type | Data-Type | Description | Mandatory ? | Default |
| :-------: | :------------: | :-------: | :---------: | :---------: | :-----: |
|   `s`     |    `query`     |  string   |   Search    |    yes ✔️   |    --   |
|  `page`   |    `query`     |  Number   |   page no.  |     No ✖️   |    1    |

#### Example of request

```javascript
import axios from "axios";
const resp = await axios.get("/api/search?s=op&page=1");
console.log(resp.data);
```

#### Sample response

```javascript
{
  "success": true,
  "mmessage": "Data Found!!",
  "results": {
    "currentPage": 1,
    "totalPages": 32,
    "results": [
      {
        "title": "A Misanthrope Teaches a Class for Demi-Humans",
        "anime_id": "a-misanthrope-teaches-a-class-for-demi-humans",
        "poster": "https://image.tmdb.org/t/p/w500/yOM6DxJblSheZwOeGwAzfIHxnCc.jpg"
      },
      {
        "title": "You and I Are Polar Opposites",
        "anime_id": "you-and-i-are-polar-opposites",
        "poster": "https://image.tmdb.org/t/p/w500/2hWDXVA0kpLlpHBgw70eNuGpu9w.jpg"
      },
      {
        "title": "If My Favorite Pop Idol Made It to the Budokan, I Would Die",
        "anime_id": "if-my-favorite-pop-idol-made-it-to-the-budokan-i-would-die",
        "poster": "https://image.tmdb.org/t/p/w500/n8tBDlRzWOA8ywyQNv3t9EokHVx.jpg"
      },
      {
        "title": "Power Rangers Season 15 Operation Overdrive",
        "anime_id": "power-rangers-operation-overdrive",
        "poster": "https://image.tmdb.org/t/p/w500\\/zOOvRQ8Sl3lNHRVFUppcP2UX6FJ.jpg"
      },
      {
        "title": "Takopi's Original Sin",
        "anime_id": "takopis-original-sin",
        "poster": "https://image.tmdb.org/t/p/w500/xPXDVhVKt0XM34ihoUVMHtLYTw8.jpg"
      }
    ]
  }
}
```
### episodes
```bash
GET /api/episode
```
### 🔗 Endpoint

```bash
/api/episode?id={string}&season={Number}
```

#### Parameters
| Parameter | Parameter-Type | Data-Type | Description | Mandatory ? | Default |
| :-------: | :------------: | :-------: | :---------: | :---------: | :-----: |
|   `id`    |    `query`     |  string   |  anime_id   |    yes ✔️   |    --   |
| `season`  |    `query`     |  Number   |   season    |     No ✖️   |    1    |


#### Example of request
```javascript
import axios from "axios";
const resp = await axios.get("/api/episode?id=jujutsu-kaisen&season=3");
console.log(resp.data);
```

#### sample response

```javascript
{
  "success": true,
  "message": "data scraped!!",
  "results": {
    "totalSeasons": string,
    "seasons": [objects],
    "episodes": [objects]
  }
}
```

### specific anime info

```bash
GET /api/newadded
```
### 🔗 Endpoint

```bash
/api/newadded
```
#### Example of request
```javascript
import axios from "axios";
const resp = await axios.get("/api/newadded");
console.log(resp.data);
```

#### Sample of response
```javascript
{
  "success": true,
  "message": "Data Found!!",
  "results": [
    {
      "title": string,
      "anime_id": string,
      "season": Number,
      "episode": number,
      "poster": string
    }
    
  ]
}
```

### Recently added episodes

```bash
GET /api/newadded
```

### 🔗 Endpoint
```bash
/api/newadded
```

#### Parameters Not required ❌️

#### Example of request

```javascript
import axios from "axios";
const resp = await axios.get("/api/newadded");
console.log(resp.data);
```
#### Sample request

```javascript
"success": true,
  "results": [
    {
      "title": "Tokyo Ghoul All",
      "anime_id": "tokyo-ghoul-all",
      "season": "3",
      "episode": "6",
      "poster": "https://image.tmdb.org/t/p/w185/3TVilpXnkeQuPP2NOA1CPn1iJuo.jpg"
    },
    {
      "title": "Tokyo Ghoul All",
      "anime_id": "tokyo-ghoul-all",
      "season": "3",
      "episode": "5",
      "poster": "https://image.tmdb.org/t/p/w185/1jQfe4g43EPZW6sA31LdeUJgyPN.jpg"
    },
    {
      "title": "Tokyo Ghoul All",
      "anime_id": "tokyo-ghoul-all",
      "season": "3",
      "episode": "4",
      "poster": "https://image.tmdb.org/t/p/w185/z6l9AqIwnAiZxwt38Abi09FdTpV.jpg"
    },
    {
      "title": "Jack-of-All-Trades, Party of None",
      "anime_id": "jack-of-all-trades-party-of-none",
      "season": "1",
      "episode": "3",
      "poster": "https://image.tmdb.org/t/p/w185/vWeeKsVrbywDeW0M5NcRBMgjg5U.jpg"
    },
    {
      "title": "Jack-of-All-Trades, Party of None",
      "anime_id": "jack-of-all-trades-party-of-none",
      "season": "1",
      "episode": "2",
      "poster": "https://image.tmdb.org/t/p/w185/m6Qxn7kXAxpatBd8YsAXJy0SrDe.jpg"
    },
    {
      "title": "Jack-of-All-Trades, Party of None",
      "anime_id": "jack-of-all-trades-party-of-none",
      "season": "1",
      "episode": "1",
      "poster": "https://image.tmdb.org/t/p/w185/wROf1bhwICvF3bZI1NpxAwtEDx7.jpg"
    },
    {
      "title": "There Was a Cute Girl in the Hero's Party, So I Tried Confessing to Her",
      "anime_id": "there-was-a-cute-girl-in-the-heros-party-so-i-tried-confessing-to-her",
      "season": "1",
      "episode": "6",
      "poster": "https://image.tmdb.org/t/p/w185/2zZ1iPHbuzxBcUPxjDOyCTGjPpW.jpg"
    },
    {
      "title": "Fairy Tail",
      "anime_id": "fairy-tail",
      "season": "7",
      "episode": "36",
      "poster": "https://toonstream.dad/home/wp-content/themes/torofilm/public/img/cnt/noimg-episode.png"
    },
    {
      "title": "One Punch Man",
      "anime_id": "one-punch-man",
      "season": "3",
      "episode": "12",
      "poster": "https://image.tmdb.org/t/p/w185/3CkzWbeQUXTxfIbNghEOZBfOhPY.jpg"
    }
  ]
}
```

### Specific Anime Info

```bash
GET /api/info
```
### 🔗 Endpoint

```bash
/api/info?id={String}
```

#### Parameters

| Parameter | Parameter-Type | Data-Type | Description | Mandatory ? | Default |
| :-------: | :------------: | :-------: | :---------: | :---------: | :-----: |
|   `id`    |    `query`     |  string   |  anime_id   |    yes ✔️   |    --   |


#### Example of request

```javascript
import axios from "axios";
const resp = await axios.get("/api/info?id=jujutsu-kaisen");
console.log(resp.data);
```
#### Sample responce

```javascript
{
  "success": true,
  "cached": true,
  "data": {
    "title": "Jujutsu Kaisen",
    "poster": "https://image.tmdb.org/t/p/w185/dGvJUOS01OrgDntHXGF04tW6oJ5.jpg",
    "overview": "Yuji Itadori is a boy with tremendous physical strength, though he lives a completely ordinary high school life. One day, to save a classmate who has been attacked by curses, he eats the finger of Ryomen Sukuna, taking the curse into his own soul. From then on, he shares one body with Ryomen Sukuna. Guided by the most powerful of sorcerers, Satoru Gojo, Itadori is admitted to Tokyo Jujutsu High School, an organization that fights the curses... and thus begins the heroic tale of a boy who became a curse to exorcise a curse, a life from which he could never turn back.",
    "language": "Hindi – Tamil – Telugu – English – Japanese",
    "quality": "1080p FHD | 720p HD | 480p",
    "runningTime": "24min",
    "genres": [
      "Action & Adventure",
      "Animation",
      "Anime Series",
      "Crunchyroll",
      "English",
      "Hindi",
      "Japaneses",
      "Sci-Fi & Fantasy",
      "Tamil",
      "Telugu"
    ],
    "year": "2020",
    "seasons": "3",
    "episodes": "55",
    "rating": "8.552"
  }
}
```

### Episodes

```bash
GET /api/episodes
```

### 🔗 Endpoint

```bash
/api/episodes?id={String}&season={Number}
```
#### Parameters

| Parameter | Parameter-Type | Data-Type | Description | Mandatory ? | Default |
| :-------: | :------------: | :-------: | :---------: | :---------: | :-----: |
|   `id`    |    `query`     |  string   |  anime_id   |    yes ✔️   |    --   |
| `season`  |    `query`     |  Number   | season no.  |     No ✖️   |    1    |

#### Example of request
```javascript
import axios from "axios";
const resp = await axios.get("/api/episodes?id=jujutsu-kaisen&season=1");
console.log(resp.data);
```

#### Sample response
```javascript
{
  "success": true,
  "message": "Data scraped!!",
  "results": {
    "totalEpisodes": 24,
    "episodes": [
      {
        "title": "Ryomen Sukuna",
        "season": "1",
        "episode": "1",
        "poster": "https://img.animesalt.top/images/13743/01.webp"
      },
      {
        "title": "For Myself",
        "season": "1",
        "episode": "2",
        "poster": "https://img.animesalt.top/images/13743/02.webp"
      },
      {
        "title": "Girl of Steel",
        "season": "1",
        "episode": "3",
        "poster": "https://img.animesalt.top/images/13743/03.webp"
      },
      {
        "title": "Curse Womb Must Die",
        "season": "1",
        "episode": "4",
        "poster": "https://img.animesalt.top/images/13743/04.webp"
      },
      {
        "title": "Curse Womb Must Die -II-",
        "season": "1",
        "episode": "5",
        "poster": "https://img.animesalt.top/images/13743/05.webp"
      },
      {
        "title": "After Rain",
        "season": "1",
        "episode": "6",
        "poster": "https://img.animesalt.top/images/13743/06.webp"
      },
      {
        "title": "Assault",
        "season": "1",
        "episode": "7",
        "poster": "https://img.animesalt.top/images/13743/07.webp"
      },
      {
        "title": "Boredom",
        "season": "1",
        "episode": "8",
        "poster": "https://img.animesalt.top/images/13743/08.webp"
      },
      {
        "title": "Small Fry and Reverse Retribution",
        "season": "1",
        "episode": "9",
        "poster": "https://img.animesalt.top/images/13743/09.webp"
      },
      {
        "title": "Idle Transfiguration",
        "season": "1",
        "episode": "10",
        "poster": "https://img.animesalt.top/images/13743/10.webp"
      },
      {
        "title": "Narrow-minded",
        "season": "1",
        "episode": "11",
        "poster": "https://img.animesalt.top/images/13743/11.webp"
      },
      {
        "title": "To You, Someday",
        "season": "1",
        "episode": "12",
        "poster": "https://img.animesalt.top/images/13743/12.webp"
      },
      {
        "title": "Tomorrow",
        "season": "1",
        "episode": "13",
        "poster": "https://img.animesalt.top/images/13743/13.webp"
      },
      {
        "title": "Kyoto Sister School Exchange Event - Group Battle 0 -",
        "season": "1",
        "episode": "14",
        "poster": "https://img.animesalt.top/images/13743/14.webp"
      },
      {
        "title": "Kyoto Sister School Exchange Event - Group Battle 1 -",
        "season": "1",
        "episode": "15",
        "poster": "https://img.animesalt.top/images/13743/15.webp"
      },
      {
        "title": "Kyoto Sister School Exchange Event - Group Battle 2 -",
        "season": "1",
        "episode": "16",
        "poster": "https://img.animesalt.top/images/13743/16.webp"
      },
      {
        "title": "Kyoto Sister School Exchange Event - Group Battle 3 -",
        "season": "1",
        "episode": "17",
        "poster": "https://img.animesalt.top/images/13743/17.webp"
      },
      {
        "title": "Sage",
        "season": "1",
        "episode": "18",
        "poster": "https://img.animesalt.top/images/13743/18.webp"
      },
      {
        "title": "Black Flash",
        "season": "1",
        "episode": "19",
        "poster": "https://img.animesalt.top/images/13743/19.webp"
      },
      {
        "title": "Nonstandard",
        "season": "1",
        "episode": "20",
        "poster": "https://img.animesalt.top/images/13743/20.webp"
      },
      {
        "title": "Jujutsu Koshien",
        "season": "1",
        "episode": "21",
        "poster": "https://img.animesalt.top/images/13743/21.webp"
      },
      {
        "title": "The Origin of Blind Obedience",
        "season": "1",
        "episode": "22",
        "poster": "https://img.animesalt.top/images/13743/22.webp"
      },
      {
        "title": "The Origin of Blind Obedience - 2 -",
        "season": "1",
        "episode": "23",
        "poster": "https://img.animesalt.top/images/13743/23.webp"
      },
      {
        "title": "Accomplices",
        "season": "1",
        "episode": "24",
        "poster": "https://img.animesalt.top/images/13743/24.webp"
      }
    ]
  }
}
```

### Series 

```bash
GET /api/series
```

### 🔗 Endpoint

```bash
/api/series?page={Number}
```

#### Parameters

| Parameter | Parameter-Type | Data-Type | Description | Mandatory ? | Default |
| :-------: | :------------: | :-------: | :---------: | :---------: | :-----: |
|   `page`  |    `query`     |   Number  |   page no.  |     No ✖️   |    1    |


#### Example of request

```javascript
import axios from "axios";
const resp = await axios.get("/api/series?page=13");
console.log(resp.data);
```

### Sample response

```javascript
Updating soon.......
```

### Movies

```bash
GET /api/movies
```

### 🔗 Endpoint

```bash
/api/movies?page={Number}
```

#### Example of request

```javascript
import axios from "axios";
const resp = await axios.get("/api/series?page=13");
console.log(resp.data);
```

#### Sample response

```javascript

```

### Anime Stream Info

```bash
GET /api/stream
```

### 🔗 Endpoint

```bash
/api/stream?id={string}&season={Number}&ep={Number}
```

#### Parameters

| Parameter | Parameter-Type | Data-Type | Description | Mandatory ? | Default |
| :-------: | :------------: | :-------: | :---------: | :---------: | :-----: |
|   `id`    |    `query`     |  string   |  anime_id   |    yes ✔️   |    --   |
| `season`  |    `query`     |  Number   |  season no. |    yes ✔️   |    --   |
|   `ep`    |    `query`     |  Number   | episode no. |    yes ✔️   |    --   |

#### Example of request

```javascript
import axios from "axios";
const resp = await axios.get("/api/stream?id=solo-leveling&season=2&ep=6");
console.log(resp.data);
```
```javascript
    {
  "success": true,
  "message": "Data Found!!",
  "results": [
    {
      "server": "options-0",
      "embed": "https://as-cdn21.top/video/1b5e669dd84003f7a70da7724e5cba93"
    },
    {
      "server": "options-1",
      "embed": "https://short.icu/r0ZKWZDhr"
    },
    {
      "server": "options-2",
      "embed": "https://rubystm.com/e/ietbgjyl1zqm.html"
    },
    {
      "server": "options-3",
      "embed": "https://cloudy.upns.one/#3vasgb"
    },
    {
      "server": "options-4",
      "embed": "https://strmup.to/dj6lpUVcgErtu"
    },
    {
      "server": "options-5",
      "embed": "https://turbovidhls.com/t/67c3d9c990671"
    },
    {
      "server": "options-6",
      "embed": "https://vidmoly.net/embed-43ypo7waxafa.html"
    },
    {
      "server": "options-7",
      "embed": "https://gdmirrorbot.nl/embed/iasiw1z"
    },
    {
      "server": "options-8",
      "embed": "https://gdmirrorbot.nl/embed/yefo5m7"
    },
    {
      "server": "options-9",
      "embed": "https://gdmirrorbot.nl/embed/y41xaiu"
    }
  ]
}
```
### Movies Info

```bash
GET /api/movie
```

### 🔗 Endpoint

```bash
/api/movie?id={string}
```
#### Example of request


```javascript
import axios from "axios";
const resp = await axios.get("/api/movie?id=demon-slayer-kimetsu-no-yaiba-infinity-castle");
console.log(resp.data);
```

#### Sample response

```javascript
{
  "success": true,
  "message": "data found",
  "results": {
    "title": "Demon Slayer: Kimetsu no Yaiba Infinity Castle",
    "anime_id": "demon-slayer-kimetsu-no-yaiba-infinity-castle",
    "poster": "https://image.tmdb.org/t/p/w185/aFRDH3P7TX61FVGpaLhKr6QiOC1.jpg",
    "overview": "The Demon Slayer Corps are drawn into the Infinity Castle, where Tanjiro, Nezuko, and the Hashira face terrifying Upper Rank demons in a desperate fight as the final battle against Muzan Kibutsuji begins.",
    "languages": [
      "Language",
      "Hindi",
      "Tamil",
      "Telugu",
      "Fan Hindi",
      "Malyalam",
      "Kannada",
      "Bengali",
      "Marathi",
      "English",
      "Japaneses",
      "Korean",
      "Chinese"
    ],
    "run_time": "2h 35m",
    "genres": [
      "Action",
      "Animation",
      "Anime Movies",
      "Fantasy",
      "Hindi",
      "Japaneses",
      "Thriller"
    ],
    "year": "2025",
    "rating": "7.4",
    "stream": [
      {
        "iframe": "https://as-cdn21.top/video/c3fdcb6bbc2bd6e8263cceb41c22b64b"
      },
      {
        "iframe": "https://short.icu/7ECVATU2H9"
      },
      {
        "iframe": "https://rubystm.com/e/m7tdz09jdxzf.html"
      },
      {
        "iframe": "https://cloudy.upns.one/#t1abcn"
      },
      {
        "iframe": "https://strmup.to/38d066963fde"
      },
      {
        "iframe": "https://gdmirrorbot.nl/embed/yyjzld1"
      },
      {
        "iframe": "https://gdmirrorbot.nl/embed/qiwe78c"
      },
      {
        "iframe": "https://gdmirrorbot.nl/embed/dx8su67"
      },
      {
        "iframe": "https://emturbovid.com/t/6973a827b7725"
      },
      {
        "iframe": "https://vidmoly.net/embed-tt84iht2acpa.html"
      }
    ]
  }
}
```
### Genre
```bash
GET /api/genre
```

### 🔗 Endpoint

```bash
/api/genre?id={string}
```
#### Example of request


```javascript
import axios from "axios";
const resp = await axios.get("/api/genre?id=animation");
console.log(resp.data);
```

#### Sample response

```javascript
{
  "success": true,
  "results": {
    "success": true,
    "currentPage": 1,
    "results": [
      {
        "title": "The Ramparts of Ice",
        "anime_id": "seriesthe-ramparts-of-ice",
        "poster": "https://image.tmdb.org/t/p/w500/rke9UC2QrogvxiQD9TGpbvqDosi.jpg"
      },
      {
        "title": "Dr. STONE",
        "anime_id": "seriesdr-stone",
        "poster": "https://image.tmdb.org/t/p/w500/x96E9mxxQf5KzXOzIu0ldsfc3QK.jpg"
      },
      {
        "title": "Fairy Tail",
        "anime_id": "seriesfairy-tail",
        "poster": "https://image.tmdb.org/t/p/w500/dorzFzD65utfD39pEu7PbcXmEFH.jpg"
      },
      {
        "title": "Dorohedoro",
        "anime_id": "seriesdorohedoro",
        "poster": "https://image.tmdb.org/t/p/w500/zSMmRTopPIRr6913KX8pyiV6zsK.jpg"
      },
      {
        "title": "Scarlet",
        "anime_id": "moviesscarlet",
        "poster": "https://image.tmdb.org/t/p/w500/2O2tOyS4kvO9GtFPHpWmbXvfRQv.jpg"
      },
      {
        "title": "Fullmetal Alchemist: Brotherhood",
        "anime_id": "seriesfullmetal-alchemist-brotherhood",
        "poster": "https://image.tmdb.org/t/p/w500/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg"
      },
      {
        "title": "Tokyo Ghoul All",
        "anime_id": "seriestokyo-ghoul-all",
        "poster": "https://image.tmdb.org/t/p/w500/wCn96kKQBRQhImMorf3napmCjfM.jpg"
      },
      {
        "title": "The Beginning After the End",
        "anime_id": "seriesthe-beginning-after-the-end",
        "poster": "https://image.tmdb.org/t/p/w500/d23Lspt2mbVP8WwJNgb5Sg4Kdhu.jpg"
      },
      {
        "title": "Witch Hat Atelier",
        "anime_id": "serieswitch-hat-atelier",
        "poster": "https://image.tmdb.org/t/p/w500/78m1Tv3suHmUryTI9VNPwKLKjHZ.jpg"
      },
      {
        "title": "BOFURI: I Don't Want to Get Hurt, so I'll Max Out My Defense.",
        "anime_id": "seriesbofuri-i-dont-want-to-get-hurt-so-ill-max-out-my-defense",
        "poster": "https://image.tmdb.org/t/p/w500/2PLjOPstyBIWdQftMLnYRE5Cojg.jpg"
      }
    ]
  }
}
```
