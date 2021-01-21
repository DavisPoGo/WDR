module.exports = async (WDR, Functions, message, Member, AreaArray) => {

    let query = `
        SELECT
            *
        FROM
            wdr_users
        WHERE
            user_id = '${Member.id}'
                AND
            guild_id = '${message.guild.id}';
    `;

    WDR.wdrDB.query(
        query,
        async function(error, user) {
            if (error) {
                WDR.Console.error(WDR, '[cmd/sub/area/add.js] Error Fetching Subscriptions to Create Subscription.', [query, error]);
                return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete({
                    timeout: 10000
                }));
            } else {

                let sub = await Functions.DetailCollect(WDR, Functions, 'Name', Member, message, null, 'Names are not case-sensitive. The Check denotes you are already subscribed to that Area.', user[0].areas, AreaArray);

                let areas;
                if (user[0].areas.includes(',')) {
                    areas = user[0].areas.split(',');
                } else {
                    areas = user[0].areas.split(';');
                }

                let area_index = areas.indexOf(sub);

                if (area_index >= 0) {
                    return message.reply('You are already subscribed to this Area.').then(m => m.delete({
                        timeout: 10000
                    }));
                } else {
                    switch (true) {
                        case sub == 'all':
                            areas = Member.db.name;
                            break;
                        case user[0].areas == message.discord.name:
                        case user[0].areas == 'None':
                            areas = [];
                            areas.push(sub);
                            break;
                        default:
                            areas.push(sub);
                    }
                }

                areas = areas.join(';');

                WDR.UpdateAllSubTables(WDR, `UPDATE %TABLE% SET areas = '${areas}' WHERE user_id = '${Member.id}'; `);

                let update = `
                    UPDATE
                        wdr_users
                    SET
                        areas = '${areas}'
                    WHERE
                        user_id = '${Member.id}'
                ;`;

                WDR.wdrDB.query(
                    update,
                    function(error) {
                        if (error) {
                            WDR.Console.error(WDR, '[cmd/sub/area/add.js] Error Updating User Geofences.', [update, error]);
                            return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete({
                                timeout: 10000
                            }));
                        } else {
                            let subscription_success = new WDR.DiscordJS.MessageEmbed().setColor('00ff00')
                                .setAuthor(Member.db.user_name, Member.user.displayAvatarURL())
                                .setTitle('**' + sub + '** Area Added!')
                                .setDescription('Saved to the Database.')
                                .setFooter('You can type \'view\', \'add\', or \'remove\'.');
                            return message.channel.send(subscription_success).then(BotMsg => {
                                return Functions.OptionCollect(WDR, Functions, 'create', message, BotMsg, Member, AreaArray);
                            });
                        }
                    }
                );
            }
        }
    );
};