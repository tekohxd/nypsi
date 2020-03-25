const { RichEmbed } = require("discord.js");
const fetch = require("node-fetch");

var cooldown = new Map()

module.exports = {
    name: "minecraft",
    description: "view information about a minecraft account",
    category: "info",
    run: async (message, args) => {

        if (!message.guild.me.hasPermission("EMBED_LINKS")) {
            return message.channel.send("❌ \ni am lacking permission: 'EMBED_LINKS'");
        }

        if (args.length == 0) {
            return message.channel.send("❌\ninvalid account");
        }

        if (cooldown.has(message.member.id)) {
            const init = cooldown.get(message.member.id)
            const curr = new Date()
            const diff = Math.round((curr - init) / 1000)
            const time = 10 - diff

            const minutes = Math.floor(time / 60)
            const seconds = time - minutes * 60

            let remaining

            if (minutes != 0) {
                remaining = `${minutes}m${seconds}s`
            } else {
                remaining = `${seconds}s`
            }
            return message.channel.send("❌\nstill on cooldown for " + remaining );
        }

        cooldown.set(message.member.id, new Date());

        setTimeout(() => {
            cooldown.delete(message.member.id);
        }, 2000);

        const username = args[0]

        const uuidURL = "https://api.mojang.com/users/profiles/minecraft/" + username
        let uuid

        try {
            uuid = await fetch(uuidURL).then(uuidURL => uuidURL.json())
        } catch (e) {
            return message.channel.send("❌\ninvalid account");
        }

        const skin = "https://visage.surgeplay.com/face/" + uuid.id

        const nameHistoryURL = "https://api.mojang.com/user/profiles/" + uuid.id +"/names"

        const nameHistory = await fetch(nameHistoryURL).then(nameHistoryURL => nameHistoryURL.json())

        const names = []

        nameHistory.reverse()

        const BreakException = {}

        try {
            nameHistory.forEach(item => {
                if (names.join().length >= 800) {
                    names.push(`view more at [namemc](https://namemc.com/profile/${username})`)
                    throw BreakException
                }
    
                if (item.changedToAt) {
                    const date = new Date(item.changedToAt)
    
                    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sept", "oct", "nov", "dec"]
        
                    const year = date.getFullYear()
                    const month = months[date.getMonth()]
                    const day = date.getDate()
        
                    const timestamp = month + " " + day + " " + year
        
                    names.push("`" + item.name + "` **|** `" + timestamp + "`")
                } else {
                    names.push("`" + item.name + "`")
                }
            });
        } catch (e) {
            if (e != BreakException) throw e
        }
        

        let color;

        if (message.member.displayHexColor == "#000000") {
            color = "#FC4040";
        } else {
            color = message.member.displayHexColor;
        }

        const embed = new RichEmbed()
            .setTitle(uuid.name)
            .setURL("https://namemc.com/profile/" + username)
            .setDescription(`[skin](https://crafatar.com/skins/${uuid.id})`)
            .setColor(color)
            .setThumbnail(skin)
            .addField("previous names", names)
            .setFooter(message.member.user.tag + " | bot.tekoh.wtf", message.member.user.avatarURL)
            .setTimestamp();
        
        return message.channel.send(embed).catch(() => {
            return message.channel.send("❌ \ni may be lacking permission: 'EMBED_LINKS'");
        })
    }
}