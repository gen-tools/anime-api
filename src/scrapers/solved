const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeEpisodes(slug,season=1){

 try{

 const url = `https://multishows.top/episode/${slug}/${season}-1`;

 const {data} = await axios.get(url);

 const $ = cheerio.load(data);

 let episodes = [];

 $(".mx-3 a").each((i,el)=>{

 const link = $(el).attr("href");

 if(!link.includes(`/${slug}/`)) return;

 const last = link.split("/").pop(); // 1-1

 const [season,episode] = last.split("-");

 const title = $(el).find("div").last().text().trim();

 episodes.push({
 season:Number(season),
 episode:Number(episode),
 title:title
 });

 });

 return {
 anime:slug,
 totalEpisodes:episodes.length,
 episodes:episodes
 }

 }catch(err){

 console.log(err.message);

 }

}

module.exports = scrapeEpisodes