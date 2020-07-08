module.exports = (WDR, Quest) => {
  return new Promise(async resolve => {
    switch (Quest.rewards[0].type) {
      case 0:
        return console.error("UNSET QUEST", Quest);
      case 1:
        return console.error("EXPERIENCE QUEST", Quest);

        // ITEM REWARDS (EXCEPT STARDUST)
      case 2:
        Quest.simple_reward = WDR.Master.Items[Quest.rewards[0].info.item_id].name;
        Quest.quest_reward = WDR.Master.Items[Quest.rewards[0].info.item_id].name;
        Quest.amount = Quest.rewards[0].info.amount;

        if (Quest.rewards[0].info.amount > 1) {
          if (Quest.quest_reward.indexOf("Berry") >= 0) {
            Quest.quest_reward = Quest.quest_reward.toString().slice(0, -1) + "ies";
          } else {
            Quest.quest_reward = Quest.quest_reward + "s";
          }
          Quest.quest_reward = Quest.amount + " " + Quest.quest_reward;
        }
        break;

        // STARDUST REWARD
      case 3:
        Quest.quest_reward = Quest.rewards[0].info.amount + " Stardust";
        break;

      case 4:
        return console.error("CANDY QUEST", Quest);

      case 5:
        return console.error("AVATAR CLOTHING QUEST", Quest);

      case 6:
        console.error("NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING:", Quest);
        break;

        // ENCOUNTER REWARDS
      case 7:

        Quest.pokemon_id = Quest.rewards[0].info.pokemon_id;
        Quest.costume_id = Quest.rewards[0].info.costume_id;

        switch (Quest.rewards[0].info.gender_id) {
          case 1:
            Quest.gender = "male";
            break;

          case 2:
            Quest.gender = "female";
            break;

          default:
            Quest.gender = "all";
        }
        Quest.gender = await WDR.Capitalize(Quest.gender) + " " + WDR.Emotes[Quest.gender];
        Quest.gender_noemoji = await WDR.Capitalize(Quest.gender);

        // GET COSTUME
        if (Quest.rewards[0] && Quest.rewards[0].info && Quest.rewards[0].info.costume_id) {
          Quest.costume = Quest.rewards[0].info.costume_id;
        } else {
          Quest.costume = 0;
        }

        // GET FORM
        if (Quest.rewards[0] && Quest.rewards[0].info && Quest.rewards[0].info.form_id) {
          Quest.form = Quest.rewards[0].info.form_id;
        } else {
          Quest.form = 0;
        }

        Quest = await WDR.Get_Locale.Pokemon(WDR, Quest);
        Quest.form = Quest.form == "[Normal]" ? "" : Quest.form;

        if (Quest.rewards[0].info.shiny) {
          Quest.pokemon_name += " (Shiny)";
          Quest.simple_reward = "Shiny " + Quest.simple_reward;
          Quest.quest_reward = "Shiny " + Quest.quest_reward;
        } else {
          Quest.simple_reward = Quest.pokemon_name;

          if (Quest.form != "") {
            Quest.quest_reward = Quest.pokemon_name + " " + Quest.form + " Encounter";
          } else {
            Quest.quest_reward = Quest.pokemon_name + " Encounter";
          }
        }
        break;
    }

    return resolve(Quest);
  });
}