/* Alliance Competition base scoring, community-sourced: https://zrouteguide.com/events/alliance-competition/event-guide/
 * Points are earned on qualifying USE / OPEN actions, not from purchasing a shop offer.
 * Event research bonuses, unfinished timer wastage and unrelated secondary actions are excluded.
 * Days are Monday (1) through Saturday (6). A single purchased item cannot be spent on multiple days.
 */
window.ZR_ALLIANCE_COMPETITION = (() => {
  "use strict";
  const days = [
    {day:1,name:"Radar Exploration",weekday:"Mon"},
    {day:2,name:"Base Construction",weekday:"Tue"},
    {day:3,name:"Tech Research",weekday:"Wed"},
    {day:4,name:"Hero Training",weekday:"Thu"},
    {day:5,name:"Full Military Preparation",weekday:"Fri"},
    {day:6,name:"Enemy Assault",weekday:"Sat"}
  ];
  // Values below are points per *one item*, except the 10-Stamina item which grants 10 stamina.
  // Match only actions verified by the stage task list and the item's official tooltip.
  const actions = {
    dark_cans_10:{1:{points:1550,task:"Use all 10 Stamina (155 per stamina)"}},
    fighter_part:{1:{points:2600,task:"Use 1 Fighter Part"}},
    card_10k:{1:{points:4,task:"Use 1 Fighter Combat Chip (4 points per chip)"}},
    blue_ticket:{2:{points:1600,task:"Recruit 1 Survivor"}},
    fighter_chest_1:{3:{points:1155,task:"Open 1 Lv.1 Fighter Component Chest"}},
    fighter_chest_3:{3:{points:10500,task:"Open 1 Lv.3 Fighter Component Chest"}},
    gold_ticket:{4:{points:1600,task:"Recruit 1 Hero"}},
    hero_gold:{4:{points:10500,task:"Use 1 UR Hero Shard"}},
    purple_puzzle:{4:{points:3600,task:"Use 1 SSR Hero Shard"}},
    blue_puzzle:{4:{points:1050,task:"Use 1 SR Hero Shard"}},
    blue_skill_book:{4:{points:12,task:"Use 1 Skill EXP Book"}}
  };
  const speedupDayTypes = {
    2:["build","generic"],
    3:["research","generic"],
    5:["build","research","train","generic"],
    6:["build","research","train","heal","generic"]
  };
  const speedupType = id => {
    const match = /^(build|research|train|heal)_/.exec(id);
    return match ? match[1] : "generic";
  };
  const scorePerItem = (item,day) => {
    if(!item || !Number.isInteger(day) || day<1 || day>6)return null;
    if(Number.isFinite(item.speedupMinutes) && item.speedupMinutes>0){
      const type=speedupType(item.id);
      if(!(speedupDayTypes[day]||[]).includes(type))return null;
      return {points:item.speedupMinutes*55,
        task:"Use "+item.speedupMinutes+" minutes of "+(type==="generic"?"eligible queue":type)+" speedup (55 points/min)"};
    }
    return actions[item.id]?.[day] ?? null;
  };
  const scoreForOffer = (item,offer,day) => {
    const rule=scorePerItem(item,day);
    if(!rule || !(Number(offer?.quantity)>0) || !Number.isFinite(Number(offer.quantity)))return null;
    return {...rule,points:rule.points*Number(offer.quantity)};
  };
  return {days,scorePerItem,scoreForOffer,source:"https://zrouteguide.com/events/alliance-competition/event-guide/"};
})();
