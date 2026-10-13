/* Game-client research levels extracted from JeffxLabs/zrouteredemption:
 * research/research_data.js (CollegeTechLevel / DefineBenefit, v1.30.07).
 * Missing numeric level benefits are intentionally unavailable, not assumed zero.
 * Percent stacking is modeled additively; actual server-side scoring/rounding may differ.
 */
window.ZR_ALLIANCE_RESEARCH = (() => {
  "use strict";
  const techs = [
  {
    "id": 9001,
    "name": "Radar Points Buff",
    "max": 10,
    "kind": "radar",
    "description": "Alliance Competition: More Radar Quest Points",
    "percentages": [
      0.05,
      0.1,
      0.15,
      0.2,
      0.25,
      0.3,
      0.35,
      0.4,
      0.45,
      0.5
    ]
  },
  {
    "id": 9002,
    "name": "Speedup Points Buff",
    "max": 10,
    "kind": "speedup",
    "description": "Alliance Competition: More Speedup Points",
    "percentages": [
      0.05,
      0.1,
      0.15,
      0.2,
      0.25,
      0.3,
      0.35,
      0.4,
      0.45,
      0.5
    ]
  },
  {
    "id": 9003,
    "name": "Recruit Points Buff",
    "max": 10,
    "kind": "hero_recruit",
    "description": "Alliance Competition: More Hero Recruitment Points",
    "percentages": [
      0.05,
      0.1,
      0.15,
      0.2,
      0.25,
      0.3,
      0.35,
      0.4,
      0.45,
      0.5
    ]
  },
  {
    "id": 9004,
    "name": "Medium Reward",
    "max": 1,
    "kind": "reward",
    "description": "Unlocks middle-tier Alliance Competition chests",
    "percentages": []
  },
  {
    "id": 9005,
    "name": "Points Buff",
    "max": 20,
    "kind": "all",
    "description": "Alliance Competition: More Points for All Actions (except Diamond Purchases)",
    "percentages": [
      0.05,
      0.1,
      0.15,
      0.2,
      0.25,
      0.3,
      0.35,
      0.4,
      0.45,
      0.5,
      0.55,
      0.6,
      0.65,
      0.7,
      0.75,
      0.8,
      0.85,
      0.9,
      0.95,
      1
    ]
  },
  {
    "id": 9006,
    "name": "Building Points Buff",
    "max": 10,
    "kind": "building_power",
    "description": "Alliance Competition: More Building Power Points",
    "percentages": [
      0.05,
      0.1,
      0.15,
      0.2,
      0.25,
      0.3,
      0.35,
      0.4,
      0.45,
      0.5
    ]
  },
  {
    "id": 9007,
    "name": "Research Points Buff",
    "max": 10,
    "kind": "research_power",
    "description": "Alliance Competition: More Tech Power Points",
    "percentages": [
      0.05,
      0.1,
      0.15,
      0.2,
      0.25,
      0.3,
      0.35,
      0.4,
      0.45,
      0.5
    ]
  },
  {
    "id": 9008,
    "name": "Training Points Buff",
    "max": 10,
    "kind": "training_power",
    "description": "Alliance Competition: More Soldier Training Points",
    "percentages": [
      0.05,
      0.1,
      0.15,
      0.2,
      0.25,
      0.3,
      0.35,
      0.4,
      0.45,
      0.5
    ]
  },
  {
    "id": 9009,
    "name": "Kill Points Buff",
    "max": 10,
    "kind": "kill",
    "description": "Alliance Competition: More Kill Points",
    "percentages": [
      0.05,
      0.1,
      0.15,
      0.2,
      0.25,
      0.3,
      0.35,
      0.4,
      0.45,
      0.5
    ]
  },
  {
    "id": 9010,
    "name": "Ultimate Reward",
    "max": 1,
    "kind": "reward",
    "description": "Unlocks final-tier Alliance Competition chests",
    "percentages": []
  },
  {
    "id": 9011,
    "name": "Convoy Points Buff",
    "max": 10,
    "kind": "convoy",
    "description": "Alliance Competition: More Transport Truck Points",
    "percentages": []
  },
  {
    "id": 9012,
    "name": "Special Ops Points Buff",
    "max": 10,
    "kind": "special_ops",
    "description": "Alliance Competition: More Special Quest Points",
    "percentages": []
  },
  {
    "id": 9013,
    "name": "Recruit Points Buff II",
    "max": 10,
    "kind": "all",
    "description": "Alliance Competition: More Points for All Actions (except Diamond Purchases)",
    "percentages": []
  },
  {
    "id": 9014,
    "name": "Points Buff II",
    "max": 10,
    "kind": "all",
    "description": "Alliance Competition: More Points for All Actions (except Diamond Purchases)",
    "percentages": []
  }
];
  const byId = Object.fromEntries(techs.map(t=>[t.id,t]));
  const clampLevel = (id,value) => {
    const t=byId[id];if(!t)return 0;
    const n=Number(value);
    return Number.isFinite(n)?Math.min(t.max,Math.max(0,Math.trunc(n))):0;
  };
  const percent = (id,levels={}) => {
    const t=byId[id]; if(!t)return null;
    const lvl=clampLevel(id,levels[id]??0);
    if(!lvl)return 0;
    return t.percentages.length>=lvl ? t.percentages[lvl-1] : null;
  };
  const model = (score,levels={}) => {
    if(!score)return null;
    const matching=techs.filter(t=>t.kind==="all" || t.kind===score.kind);
    const active=[],unknown=[];
    for(const t of matching){
      const lvl=clampLevel(t.id,levels[t.id]??0);
      if(!lvl)continue;
      const value=percent(t.id,levels);
      if(value==null){unknown.push({id:t.id,name:t.name,level:lvl});continue;}
      if(value>0)active.push({id:t.id,name:t.name,level:lvl,percent:value,added:score.points*value});
    }
    const stable = value => Math.round((value+Number.EPSILON)*1e6)/1e6;
    const percentTotal=stable(active.reduce((sum,b)=>sum+b.percent,0));
    const total=stable(score.points*(1+percentTotal));
    return {base:score.points,percentTotal,bonus:stable(total-score.points),
      total,active,unknown};
  };
  return {techs,byId,clampLevel,percent,model,source:"https://github.com/JeffxLabs/zrouteredemption/blob/main/research/research_data.js"};
})();
