const Send_PvP = require('../embeds/pvp.js');
const pvp = require('../base/pvp.js');

module.exports.run = async (MAIN, sighting, area, server, timezone, role_id) => {

  // IF RUNNING UIV AND POKEMON DOESN'T HAVE IV WAIT UNTIL IT IS RESET BY RDM IF/WHEN IT GETS IV CHECKED
  if(MAIN.config.UIV != 'DISABLED' && !sighting.cp) { return; }

  if(MAIN.config.PVP.Discord_Feeds != 'ENABLED'){ return; }

  // DON'T FILTER IF FEEDS ARE DISABLED
  if(MAIN.config.POKEMON.Discord_Feeds != 'ENABLED'){ return; }

  // VARIABLES
  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  let time_now = new Date().getTime(); internal_value = Math.floor(internal_value*1000)/10;

  // CHECK ALL FILTERS
  MAIN.PVP_Channels.forEach((pokemon_channel,index) => {

    // DEFINE FILTER VARIABLES
    let geofences = pokemon_channel[1].geofences.split(',');
    let channel = MAIN.channels.get(pokemon_channel[0]);
    let filter = MAIN.Filters.get(pokemon_channel[1].filter);
    let embed = pokemon_channel[1].embed ? pokemon_channel[1].embed : 'pvp.js';
    let role_id = '';

    // DETERMINE GENDER
    switch(sighting.gender){
      case 1: gender = 'male'; break;
      case 2: gender = 'female'; break;
      default: gender = 'all';
    }

    // CHECK FOR INVALID DATA
    if(!filter){ return console.error('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+pokemon_channel[0]+' does not appear to exist.'); }
    if(!channel){ return console.error('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+pokemon_channel[0]+' does not appear to exist.'); }
    if(filter.Type != 'pokemon'){ return console.error('['+MAIN.config.BOT_NAME+'] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+pokemon_channel[0]+' does not appear to be a pokemon filter.'); }

    // ADD ROLE ID IF IT EXISTS
    if(pokemon_channel[1].roleid){
      if(pokemon_channel[1].roleid == 'here' || pokemon_channel[1].roleid == 'everyone'){
        role_id = '@'+pokemon_channel[1].roleid;
      } else{
        role_id = '<@&'+pokemon_channel[1].roleid+'>';
      }
    }

    // CHECK FILTER GEOFENCES
    if(geofences.indexOf(server.name) >= 0 || geofences.indexOf(area.main) >= 0 || geofences.indexOf(area.sub) >= 0){

      // no need to calculate possible CP if current CP wasn't provided
      if(!sighting.cp) { return };
      if(sighting.cp > filter.max_cp_range) { return; }
      if(filter[MAIN.masterfile.pokemon[sighting.pokemon_id].name] != 'True'){ return; }
      let possible_cps = pvp.CalculatePossibleCPs(MAIN, sighting.pokemon_id, sighting.form, sighting.individual_attack, sighting.individual_defense, sighting.individual_stamina, sighting.pokemon_level, gender, filter.min_cp_range, filter.max_cp_range);
      let unique_cps = {};

      for(var i = possible_cps.length - 1; i >= 0; i--){
        if(!unique_cps[possible_cps[i].pokemonID]){
          unique_cps[possible_cps[i].pokemonID] = {};
          let pvpRanks = pvp.CalculateTopRanks(MAIN, possible_cps[i].pokemonID, possible_cps[i].formID, filter.max_cp_range);
          let rank = pvpRanks[sighting.individual_attack][sighting.individual_defense][sighting.individual_stamina];
          unique_cps[possible_cps[i].pokemonID].rank = rank.rank;
          unique_cps[possible_cps[i].pokemonID].percent = rank.percent;
          unique_cps[possible_cps[i].pokemonID].level = rank.level;
          unique_cps[possible_cps[i].pokemonID].cp = possible_cps[i].cp;
        }
      }

      unique_cps = pvp.FilterPossibleCPsByRank(unique_cps, filter.min_pvp_rank);
      unique_cps = pvp.FilterPossibleCPsByPercent(unique_cps, filter.min_pvp_percent);

      if(Object.keys(unique_cps).length == 0 ) { return; }

      return Send_PvP.run(MAIN, channel, sighting, internal_value, time_now, area, server, timezone, role_id, embed, unique_cps);
    }
  }); return;
}
