// Load up the discord.js library
const Discord = require("discord.js");
//global.fetch = require("node-fetch");
const fetch = require("node-fetch");
const fs = require('fs');

let rawdata = fs.readFileSync('timestamp.json');
let last_posted_timestamp=1601678718;
fs.readFile('timestamp.json', (err, data) => 
{
 if (err) throw err;
 let timestampfile = JSON.parse(rawdata);
 //console.log(timestampfile);
 last_posted_timestamp=timestampfile.timestamp
 console.log(last_posted_timestamp);
});


/*
 DISCORD.JS VERSION 12 CODE
*/


// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

async function getReposts(channel_id) 
{
 var reposts = []
 const body = {method: "claim_search",
          params: {channel_ids: [channel_id],
          claim_type: 'repost',
          order_by: 'release_time',
          timestamp: `>${last_posted_timestamp}`,
          no_totals: true,
          page_size: 10}}
 const call = await fetch('http://localhost:5279', {
            method: 'post',
            body:    JSON.stringify(body),
        })
 const result = await call.json()
 result.result.items.map(item => 
 {
  //reposts.push(item.canonical_url)
  //reposts.push([item.canonical_url, item.timestamp])
  //console.log(item.reposted_claim.value.thumbnail)
  reposts.push([item.canonical_url, item.timestamp, item.reposted_claim.value.thumbnail, item.reposted_claim.value.title])
 })
 return reposts
}

const  intervalmilliseconds = config.posteveryXmins * 60000; 
const channelid=config.channelid;
const yourLBRYchannelClaimId=config.yourLBRYchannelClaimId;
const yourLBRYchannelURL=config.yourLBRYchannelURL;

//console.log(channelid);
console.log(yourLBRYchannelClaimId);
//console.log(yourLBRYchannelURL);

client.on("ready", () => {
  // This event will run if the bot starts, and logs in, successfully.
  console.log(`Bot has started, with ${client.users.cache.size} users, in ${client.channels.cache.size} channels of ${client.guilds.cache.size} guilds.`);
  // Example of changing the bot's playing game to something useful. `client.user` is what the
  // docs refer to as the "ClientUser".
  client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);

  // this is the code to autopost every X minutes on a dedicated channel 
setInterval(async() => {
  // we have to add a timestamp to the URL so that discord does not cache the image
  const d = Math.floor(Date.now() / 1000);
  //const hm = "http://neoxena.ww7.be/heatmap_5m.png" + "?t=" + d;
  const datenow = new Date();
  const dateutc = datenow.toUTCString();
  var repostslist = [];
  //var reposts = getReposts('6e202c3726d1225c90637a2204c696b12c746a78')
  //reposts = await getReposts(yourLBRYchannelClaimId);
  repostslist = await getReposts(yourLBRYchannelClaimId);
  let PerElement = function(element) 
  {
   var LBRYlink = element[0];
   var timestamp = element[1];
   var image =  element[2].url;
   //console.log(image);
   var title =  element[3];
   if ( timestamp > last_posted_timestamp )
   {
    //console.log ( timestamp + " > " + last_posted_timestamp );
    //console.log ( LBRYlink );
    var HTTPlink = LBRYlink.replace("lbry://", "https://odysee.com/"); 
    //console.log ( HTTPlink );
    //console.log ( timestamp );
    // building the embed that will be posted
    const HMEmbed = new Discord.MessageEmbed()
	.setTitle( title )
	.setDescription( 'Nuevo reposteo: ' + HTTPlink )
	          .setColor('#ed196b')
	.addField('Título', 'noticias recientes reposteadas en el siguiente [link](https://odysee.com/'+ yourLBRYchannelURL +'), canal de Michael Mitnick, en Odysee.', dateutc, true)
	.setTimestamp()
	.setImage( image)
	.setFooter('Fuente: lbry://'+ yourLBRYchannelURL +' ', 'https://odysee.com/public/favicon.png');
    client.channels.cache.get(config.channelid).send(HMEmbed);
    last_posted_timestamp = timestamp;
    let jsonline ={ 
	        timestamp: last_posted_timestamp
    }
    let data = JSON.stringify(jsonline);
    fs.writeFileSync('timestamp.json', data);
   }
  }
  repostslist.forEach(PerElement);
   //console.log(last_posted_timestamp)
   // 60000 milliseconds in 1 minute
        }, intervalmilliseconds); // Runs this every X milliseconds.
});

client.on("guildCreate", guild => {
  // This event triggers when the bot joins a guild.
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
});

client.on("guildDelete", guild => {
  // this event triggers when the bot is removed from a guild.
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Serving ${client.guilds.cache.size} servers`);
});

client.on("message", async message => {
  // This event will run on every single message received, from any channel or DM.
  
  // It's good practice to ignore other bots. This also makes your bot ignore itself
  // and not get into a spam loop (we call that "botception").
  if(message.author.bot) return;
  
  // Also good practice to ignore any message that does not start with our prefix, 
  // which is set in the configuration file.
  if(!message.content.startsWith(config.prefix)) return;
  
  // Here we separate our "command" name, and our "arguments" for the command. 
  // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
  // command = say
  // args = ["Is", "this", "the", "real", "life?"]
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
 
  // this is the main command, ln for LBRY news
  if(command === "ln") {

   // we have to add a timestamp to the URL so that discord does not cache the image
   const d = Math.floor(Date.now() / 1000);
   const datenow = new Date();
   const dateutc = datenow.toUTCString();


   // building the embed that will be posted
   const HMEmbed = new Discord.MessageEmbed()
	.setColor('#ed196b')
	.addField('Título', 'noticias recientes reposteadas en el siguiente [link](https://odysee.com/'+ yourLBRYchannelURL +'), canal de Michael Mitnick, en Odysee.', dateutc, true)
	.setTimestamp()
	.setFooter('Fuente: lbry://'+ yourLBRYchannelURL +' ', 'https://odysee.com/public/favicon.png');
   message.channel.send(HMEmbed);
  }
 
  // Let's go with a few common example commands! Feel free to delete or change those.
  if(command === "ping") {
    // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
    // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
  }
  
});



client.login(config.token);

