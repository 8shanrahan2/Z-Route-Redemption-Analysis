/* CastleBox Hero EXP per Base level, from game catalog V202610032200.
 * https://github.com/JeffxLabs/zrouteredemption/blob/main/data/hero_exp.json
 * Day 4 event scoring: 650 Hero EXP spent = 1 Alliance Competition point.
 * Points are earned on spending EXP, not buying/opening the chest.
 */
window.ZR_HERO_EXP = (() => {
  "use strict";
  const source="https://github.com/JeffxLabs/zrouteredemption/blob/main/data/hero_exp.json";
  const defaultBaseLevel=21, maxBaseLevel=30, expPerPoint=650;
  // R chest EXP at Base 1–30. Higher rarities use exact CastleBox multipliers.
  const rExp=[2790,2790,2790,2790,2790,2790,2790,2790,3600,4540,5760,7390,9480,12120,15370,19620,24600,30240,36990,42000,46800,51600,55200,60260,67800,74400,81600,89020,98400,108210];
  const multipliers={R:1,SR:10,SSR:80,UR:240};
  const chestGrades={xp_chest_blue:"SR",xp_chest_purple:"SSR",xp_chest_brown:"UR"};
  const normalizeBaseLevel=value=>{
    const level=Number(value);
    return Number.isInteger(level)&&level>=1&&level<=maxBaseLevel?level:defaultBaseLevel;
  };
  const gradeForItem=id=>chestGrades[id]??null;
  const expForGrade=(grade,baseLevel=defaultBaseLevel)=>
    multipliers[grade]?rExp[normalizeBaseLevel(baseLevel)-1]*multipliers[grade]:null;
  const expForItem=(id,baseLevel=defaultBaseLevel)=>expForGrade(gradeForItem(id),baseLevel);
  return {source,defaultBaseLevel,maxBaseLevel,expPerPoint,gradeForItem,expForGrade,expForItem,normalizeBaseLevel};
})();
