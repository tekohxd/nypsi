const { getBalance, createUser, updateBalance, userExists } = require("../utils/economy/utils.js")
const Discord = require("discord.js")
const { Message } = require("discord.js")
const shuffle = require("shuffle-array")
const { Command, categories } = require("../utils/classes/Command")
const { ErrorEmbed, CustomEmbed } = require("../utils/classes/EmbedBuilders.js")
const { isPremium, getTier } = require("../utils/premium/utils")

const cooldown = new Map()

const cmd = new Command(
    "storerob",
    "attempt to rob a store for a reward",
    categories.MONEY
).setAliases(["shoprob"])

/**
 * @param {Message} message
 * @param {Array<String>} args
 */
async function run(message, args) {
    if (!userExists(message.member)) createUser(message.member)

    if (getBalance(message.member) < 1000) {
        return await message.channel.send(
            new ErrorEmbed("you must have atleast $1k in your wallet to rob a store")
        )
    }

    const shopWorth = new Discord.Collection()

    if (getBalance(message.member) > 500000) {
        shopWorth.set("primark", Math.round(getBalance(message.member) * 0.05))
        shopWorth.set("asda", Math.round(getBalance(message.member) * 0.5))
        shopWorth.set("tesco", Math.round(getBalance(message.member) * 0.2))
        shopWorth.set("morrisons", Math.round(getBalance(message.member) * 0.1))
        shopWorth.set("walmart", Math.round(getBalance(message.member) * 0.5))
        shopWorth.set("target", Math.round(getBalance(message.member) * 0.2))
        shopWorth.set("7eleven", Math.round(getBalance(message.member) * 0.1))
    } else {
        shopWorth.set("primark", Math.round(getBalance(message.member) * 0.1))
        shopWorth.set("asda", Math.round(getBalance(message.member) * 0.7))
        shopWorth.set("tesco", Math.round(getBalance(message.member) * 0.4))
        shopWorth.set("morrisons", Math.round(getBalance(message.member) * 0.3))
        shopWorth.set("walmart", Math.round(getBalance(message.member) * 0.7))
        shopWorth.set("target", Math.round(getBalance(message.member) * 0.3))
        shopWorth.set("7eleven", Math.round(getBalance(message.member) * 0.3))
    }

    if (args[0] == "status") {
        let shopList = ""

        for (const shop1 of shopWorth.keys()) {
            shopList =
                shopList + "**" + shop1 + "** $" + shopWorth.get(shop1).toLocaleString() + "\n"
        }

        shopList =
            shopList + "the most you can recieve on one robbery is 90% of the store's balance"

        const embed = new CustomEmbed(message.member, false, shopList).setTitle(
            "current store balances"
        )

        return message.channel.send(embed)
    }

    let cooldownLength = 600

    if (isPremium(message.author.id)) {
        if (getTier(message.author.id) == 4) {
            cooldownLength = 300
        }
    }

    if (cooldown.has(message.member.id)) {
        const init = cooldown.get(message.member.id)
        const curr = new Date()
        const diff = Math.round((curr - init) / 1000)
        const time = cooldownLength - diff

        const minutes = Math.floor(time / 60)
        const seconds = time - minutes * 60

        let remaining

        if (minutes != 0) {
            remaining = `${minutes}m${seconds}s`
        } else {
            remaining = `${seconds}s`
        }
        return message.channel.send(new ErrorEmbed(`still on cooldown for \`${remaining}\``))
    }

    cooldown.set(message.member.id, new Date())

    setTimeout(() => {
        cooldown.delete(message.author.id)
    }, cooldownLength * 1000)

    const shops = Array.from(shopWorth.keys())

    const shop = shops[Math.floor(Math.random() * shops.length)]
    const amount = Math.floor(Math.random() * 85) + 5
    const caught = Math.floor(Math.random() * 15)

    let robberySuccess = true
    let robbedAmount = 0

    let percentLost
    let amountLost

    if (caught <= 5) {
        robberySuccess = false

        percentLost = Math.floor(Math.random() * 50) + 10
        amountLost = Math.round((percentLost / 100) * getBalance(message.member))

        updateBalance(message.member, getBalance(message.member) - amountLost)
    } else {
        robberySuccess = true

        robbedAmount = Math.round((amount / 100) * shopWorth.get(shop))

        updateBalance(message.member, getBalance(message.member) + robbedAmount)
    }

    const embed = new CustomEmbed(message.member, true, "robbing " + shop + "..").setTitle(
        "store robbery | " + message.member.user.username
    )

    message.channel.send(embed).then((m) => {
        if (robberySuccess) {
            embed.addField(
                "**success!!**",
                "**you stole** $" +
                    robbedAmount.toLocaleString() +
                    " (" +
                    amount +
                    "%) from **" +
                    shop +
                    "**"
            )
            embed.setColor("#5efb8f")
        } else {
            embed.addField(
                "**you were caught**",
                "**you lost** $" + amountLost.toLocaleString() + " (" + percentLost + "%)"
            )
            embed.setColor("#e4334f")
        }

        setTimeout(() => {
            m.edit(embed)
        }, 1500)
    })
}

cmd.setRun(run)

module.exports = cmd
