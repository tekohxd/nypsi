const { eSnipe } = require("../../nypsi")
const { hasGuild, createGuild, getSnipeFilter, getChatFilter } = require("../../guilds/utils")
const { Message } = require("discord.js")

/**
 * @param {Message} message
 */
module.exports = async (message) => {
    if (!message) return

    if (!message.member) return

    if (!message.member.hasPermission("ADMINISTRATOR")) {
        const filter = getChatFilter(message.guild)

        let content = message.content.toLowerCase().normalize("NFD")
    
        content = content.replace(/[^A-z0-9\s]/g, "")
    
        for (let word of filter) {
            if (content.includes(word.toLowerCase())) {
                return await message.delete()
            }
        }
    }

    if (message.content != "" && !message.member.user.bot && message.content.length > 1) {

        if (!hasGuild(message.guild)) createGuild(message.guild)

        const filter = getSnipeFilter(message.guild)

        let content = message.content.toLowerCase().normalize("NFD")

        content = content.replace(/[^A-z0-9\s]/g, "")

        for (let word of filter) {
            if (content.includes(word.toLowerCase())) return
        }

        eSnipe.set(message.channel.id, {
            content: message.content,
            member: message.author.tag,
            createdTimestamp: message.createdTimestamp,
            channel: {
                id: message.channel.id
            }
        })

        exports.eSnipe = eSnipe
    }
}