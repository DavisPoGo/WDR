module.exports = (WDR, Functions, Message, Member, advanced) => {
    WDR.wdrDB.query(`
        SELECT
            *
        FROM
            wdr_pokemon_subs
        WHERE
            user_id = '${Member.id}'
                AND
            guild_id = '${Message.guild.id}'
        LIMIT 31
    ;`,
    async function (error, subs) {
        if (error) {
            WDR.Console.error(WDR, '[subs/poke/create.js] Error Fetching Subscriptions to Create Subscription.', [error]);
            return Message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete({
                timeout: 10000
            }));
        } else if (subs.length >= 30) {
            let subscription_success = new WDR.DiscordJS.MessageEmbed().setColor('00ff00')
                .setAuthor(Member.db.user_name, Member.user.displayAvatarURL())
                .setTitle('Maximum Subscriptions Reached!')
                .setDescription('You are at the maximum of 50 subscriptions. Please remove one before adding another.')
                .setFooter('You can type \'view\', \'presets\', \'remove\', or \'edit\'.');
            Message.channel.send(subscription_success).then(BotMsg => {
                return Functions.OptionCollect(WDR, Functions, 'create', Message, BotMsg, Member);
            });
        } else {
            let create = {};
            create.pokemon = await Functions.DetailCollect(WDR, Functions, 'Name', Member, Message, null, 'Respond with \'All\' or the Pokémon Name and Form if it has one. Names are not case-sensitive.', create);
            if (create.pokemon === null) {
                return;
            } else if (create.pokemon.name) {
                create.name = create.pokemon.name;
                create.pokemon_id = create.pokemon.id;
                create.forms = create.pokemon.forms;
                create.form_ids = create.pokemon.form_ids;
            } else {
                create.name = 'All';
                create.pokemon_id = 0;
            }

            if (create.pokemon_id > 0 && create.forms.length > 1) {
                create.form = await Functions.DetailCollect(WDR, Functions, 'Form', Member, Message, null, 'Please respond with the displayed number of the form -OR- type \'All\'. Type \'Cancel\' to Stop.', create);
                if (create.form === null) {
                    return;
                }

            } else {
                create.form = 0;
            }

            if (advanced == true) {

                if (create.pokemon === 0) {
                    create.pokemon_type = await Functions.DetailCollect(WDR, Functions, 'Type', Member, Message, null, 'Please respond with \'All\' or the Pokemon Type.', create);
                    if (create.pokemon_type === null) {
                        return;
                    }

                    create.gen = await Functions.DetailCollect(WDR, Functions, 'Generation', Member, Message, null, 'Please respond with the Generation number -OR- type \'All\'. Type \'Cancel\' to Stop.', create);
                    if (create.gen === null) {
                        return;
                    }
                } else {

                    create.pokemon_type = 0;
                    create.gen = 0;
                }

                create.min_iv = await Functions.DetailCollect(WDR, Functions, 'Minimum IV', Member, Message, null, 'Please respond with a IV number between 0 and 100 -OR- type \'All\'. Type \'Cancel\' to Stop.', create);
                if (create.gen === null) {
                    return;
                }

                if (create.min_iv == 100) {
                    create.max_iv = 100;

                } else {
                    create.max_iv = await Functions.DetailCollect(WDR, Functions, 'Maximum IV', Member, Message, null, 'Please respond with a IV number between 0 and 100 -OR- type \'All\'. Type \'Cancel\' to Stop.', create);
                    if (create.max_iv === null) {
                        return;
                    }

                }

                create.min_lvl = await Functions.DetailCollect(WDR, Functions, 'Minimum Level', Member, Message, null, 'Please respond with a value between 1 and ' + WDR.Max_Pokemon_Level + ' or type \'All\'. Type \'Cancel\' to Stop.', create);
                if (create.min_lvl === null) {
                    return;
                }

                if (create.min_lvl == WDR.Max_Pokemon_Level) {
                    create.max_lvl = WDR.Max_Pokemon_Level;

                } else {

                    create.max_lvl = await Functions.DetailCollect(WDR, Functions, 'Maximum Level', Member, Message, null, 'Please respond with a value between 1 and ' + WDR.Max_Pokemon_Level + ' or type \'All\'. Type \'Cancel\' to Stop.', create);
                    if (create.max_lvl === null) {
                        return;
                    }
                }

                if (create.pokemon_id > 0) {

                    create.gender = await Functions.DetailCollect(WDR, Functions, 'Gender', Member, Message, null, 'Please respond with \'Male\' or \'Female\' or type \'All\'.', create);
                    if (create.gender === null) {
                        return;
                    }

                    create.size = await Functions.DetailCollect(WDR, Functions, 'Size', Member, Message, null, 'Please respond with \'big\', \'large\', \'normal\', \'small\', \'tiny\' or \'All\'.', create);
                    if (create.size === null) {
                        return;
                    }

                    if (create.size !== 0) {
                        create.size = create.size.toLowerCase();
                    }
                } else {
                    create.size = 0;
                    create.gender = 0;
                }
            } else {

                create.max_iv = 100;
                create.max_lvl = WDR.Max_Pokemon_Level;
                create.gender = 0;
                create.pokemon_type = 0;
                create.gen = 0;
                create.size = 0;

                create.min_iv = await Functions.DetailCollect(WDR, Functions, 'Minimum IV', Member, Message, null, 'Please respond with a IV number between 0 and 100 -OR- type \'All\'. Type \'Cancel\' to Stop.', create);
                if (create.min_iv === null) {
                    return;
                }

                create.min_lvl = await Functions.DetailCollect(WDR, Functions, 'Minimum Level', Member, Message, null, 'Please respond with a value between 0 and ' + WDR.Max_Pokemon_Level + ' or type \'All\'. Type \'Cancel\' to Stop.', create);
                if (create.min_lvl === null) {
                    return;
                }
            }

            create.geotype = await Functions.DetailCollect(WDR, Functions, 'Geofence', Member, Message, null, 'Please respond with \'Yes\' or \'No\'', create);
            if (create.geotype === null) {
                return;
            }

            create.confirm = await Functions.DetailCollect(WDR, Functions, 'Confirm-Add', Member, Message, null, 'Type \'Yes\' or \'No\'. Subscription will be saved.', create);
            if (create.confirm === false) {
                return Functions.Cancel(WDR, Functions, Message, Member);
            } else {

                let query = `
                        INSERT INTO
                            wdr_pokemon_subs (
                                user_id,
                                user_name,
                                guild_id,
                                guild_name,
                                bot,
                                status,
                                geotype,
                                areas,
                                location,
                                pokemon_id,
                                pokemon_type,
                                form,
                                min_lvl,
                                max_lvl,
                                min_iv,
                                max_iv,
                                size,
                                gender,
                                generation
                            )
                        VALUES (
                            '${Member.id}',
                            '${Member.db.user_name}',
                            '${Message.guild.id}',
                            '${Member.db.guild_name}',
                            ${Member.db.bot},
                            ${Member.db.pokemon_status},
                            '${create.geotype}',
                            '${Member.db.areas}',
                            '${JSON.stringify(Member.db.location)}',
                            ${create.pokemon_id},
                            '${create.pokemon_type}',
                            ${create.form},
                            ${create.min_lvl},
                            ${create.max_lvl},
                            ${create.min_iv},
                            ${create.max_iv},
                            '${create.size}',
                            ${create.gender},
                            ${create.gen}
                        )
                    ;`;
                WDR.wdrDB.query(
                    query,
                    function (error) {
                        if (error) {
                            if (error.toString().indexOf('Duplicate entry') >= 0) {
                                let subscription_success = new WDR.DiscordJS.MessageEmbed().setColor('00ff00')
                                    .setAuthor(Member.db.user_name, Member.user.displayAvatarURL())
                                    .setTitle('Existing Subscription Found!')
                                    .setDescription('Nothing Has Been Saved.' + '\n' + +'\n' +
                                            'Use the view to see if your overall or pokemon status is Active if you are not receiving DMs.')
                                    .setFooter('You can type \'view\', \'presets\', \'add\', \'add adv\', \'remove\', or \'edit\'.');
                                Message.channel.send(subscription_success).then(BotMsg => {
                                    return Functions.OptionCollect(WDR, Functions, 'complete', Message, BotMsg, Member);
                                });
                            } else {
                                WDR.Console.error(WDR, '[subs/pokemon/begin.js] Error Inserting Subscription.', [query, error]);
                                return Message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete({
                                    timeout: 10000
                                }));
                            }
                        } else {
                            let subscription_success = new WDR.DiscordJS.MessageEmbed().setColor('00ff00')
                                .setAuthor(Member.db.user_name, Member.user.displayAvatarURL())
                                .setTitle(create.name + ' Subscription Complete!')
                                .setDescription('Saved to the subscription Database.')
                                .setFooter('You can type \'view\', \'presets\', \'add\', \'add adv\', \'remove\', or \'edit\'.');
                            Message.channel.send(subscription_success).then(BotMsg => {
                                return Functions.OptionCollect(WDR, Functions, 'complete', Message, BotMsg, Member);
                            });
                        }
                    }
                );
            }
        }
    }
    );
};