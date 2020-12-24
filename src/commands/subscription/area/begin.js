var Functions = {
    Add: require(__dirname + '/add.js'),
    Cancel: require(__dirname + '/../cancel.js'),
    DetailCollect: require(__dirname + '/collect_detail.js'),
    OptionCollect: require(__dirname + '/collect_option.js'),
    Remove: require(__dirname + '/remove.js'),
    TimedOut: require(__dirname + '/../timedout.js'),
    View: require(__dirname + '/view.js'),
    Dir: __filename.split('/').slice(__dirname.split('/').length - 4).join('/')
};

module.exports = async (WDR, message) => {

    var Member = message.member ? message.member : message.author;

    let geofence = await WDR.Geofences.get(message.discord.geojson_file);

    if (!geofence) {
        return message.reply('No geofence file has been set for this server. Contact a server admin if you think this is incorrect.').then(m => m.delete({
            timeout: 5000
        })).catch(console.error);
    }

    let AreaArray = [];
    await geofence.features.forEach((geofence) => {
        AreaArray.push(geofence.properties.name);
    });

    AreaArray.sort();

    if (Member.db.geotype != 'areas') {
        let keep_location = await Functions.DetailCollect(WDR, Functions, 'Area', Member, message, Member.db, 'Type \'Yes\' to override and continue or \'No\' to cancel and keep area-based subscriptions.', null, AreaArray);
        if (keep_location == false) {
            let kept_location = new WDR.DiscordJS.MessageEmbed().setColor('00ff00')
                .setAuthor(message.member.db.user_name, message.member.user.displayAvatarURL())
                .setTitle('You have chose to keep **Location-Based** notifications.')
                .setFooter('You can modify your location-based settings by using the \'' + WDR.Config.PREFIX + 'location\' command.');
            return message.reply(kept_location).then(m => m.delete({
                timeout: 10000
            })).catch(console.error);
        } else {
            WDR.UpdateAllSubTables(WDR, `UPDATE %TABLE% SET geotype = 'areas' WHERE user_id = '${Member.id}'`);
            WDR.wdrDB.query(`
        UPDATE
            wdr_users
        SET
            geotype = 'areas'
        WHERE
            user_id = '${Member.id}'
              AND
            guild_id = '${message.guild.id}'
      ;`);
            let now_area = new WDR.DiscordJS.MessageEmbed().setColor('00ff00')
                .setAuthor(message.member.db.user_name, message.member.user.displayAvatarURL())
                .setTitle('You have changed to **Area-Based** notifications.');
            return message.reply(now_area).then(m => m.delete({
                timeout: 5000
            })).catch(console.error);
        }
    }

    let requestAction = new WDR.DiscordJS.MessageEmbed()
        .setAuthor(Member.db.user_name, Member.user.displayAvatarURL())
        .setTitle('What would you like to do with your Area Subscriptions?')
        .setDescription('`view`  »  View your Areas.' + '\n' +
      '`add`  »  Add an Area.' + '\n' +
      '`remove`  »  Remove an Area.')
        .setFooter('Type the action, no command prefix required.');

    message.channel.send(requestAction).catch(console.error).then(BotMsg => {
        return Functions.OptionCollect(WDR, Functions, 'start', message, BotMsg, Member, AreaArray);
    });
};
