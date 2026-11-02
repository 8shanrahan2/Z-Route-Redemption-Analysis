import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialState,makeHero,lineup,heroStats,simulate,validate,isUnlocked,skillRow,heroById,accountStats} from '../combat/model.mjs';
import {skillValue,soldierStats} from '../combat/research.mjs';
const data=JSON.parse(readFileSync(new URL('../combat/data.json',import.meta.url)));
const copy=x=>structuredClone(x),s=initialState();
assert.equal(data.heroes.length,31);
assert.equal(lineup(data,s.squads[0].heroes),.2);
assert.equal(lineup(data,[10007,50001,30006,50004,50005].map(makeHero)),.1);
assert.equal(lineup(data,[10007,50001,30006,50004,30004].map(makeHero)),.05);
assert.equal(lineup(data,[10007,50001,30006,20009,30004].map(makeHero)),.15);
assert.equal(lineup(data,[10007,50001,50004,50005,30004].map(makeHero)),0);
const h=s.squads[0].heroes[0];
assert.ok(heroStats(data,{...h,level:101}).hp>heroStats(data,h).hp);
assert.ok(heroStats(data,{...h,stars:4,starStep:20}).attack>heroStats(data,h).attack);
assert.ok(heroStats(data,{...h,starStep:16}).hp>heroStats(data,h).hp);
assert.deepEqual(heroStats(data,{...h,stats:{hp:123,attack:45,defense:6}}),{hp:123,attack:45,defense:6});
const active=heroById(data,10007).skills[1];
assert.equal(isUnlocked(active,{level:4,stars:5}),false);
assert.equal(isUnlocked(active,{level:5,stars:0}),true);
assert.equal(skillRow(active,3).skill_level,10);
const specialty=heroById(data,10007).skills[3];
assert.equal(isUnlocked(specialty,{level:31,stars:3}),false);
assert.equal(isUnlocked(specialty,{level:31,stars:4}),true);
const snapshot=copy(s),r=simulate(data,s);
assert.deepEqual(s,snapshot,'Simulation must not mutate editable squads');
assert.deepEqual(simulate(data,s),r,'A seed must reproduce the complete trace');
assert.ok(r.teams.flat().every(h=>Number.isFinite(h.hp)&&h.hp>=0&&h.shield>=0));
assert.ok(r.timeline.every(p=>p.A>=0&&p.A<=100&&p.B>=0&&p.B<=100));
const symmetric=copy(s);symmetric.squads[1]=copy(symmetric.squads[0]);symmetric.model.critChance=0;
for(const squad of symmetric.squads)for(const hero of squad.heroes)hero.active=0;
assert.equal(simulate(data,symmetric).winner,'draw','Simultaneous equal squads must draw');
// Isolate the counter direction: Tactical should receive 20% less damage from Warrior.
const counter=copy(s);counter.model={...counter.model,duration:10,shieldScale:0,critChance:0};
for(const squad of counter.squads)for(const hero of squad.heroes){hero.level=1;hero.stars=0;hero.starStep=0;hero.stats={hp:1e8,attack:100,defense:0};hero.auto=100;}
counter.squads[0].heroes[0].id=10005;counter.squads[0].heroes[4].id=10007;
const reduced=simulate(data,counter);
const neutral=copy(counter);neutral.squads[1].heroes[0].id=30004;
const full=simulate(data,neutral);
// A's first two front-priority targets in this trace are the first defender.
assert.ok(reduced.teams[0].reduce((n,h)=>n+h.damage,0)<full.teams[0].reduce((n,h)=>n+h.damage,0));
const boosted=copy(s);boosted.squads[0].tech.attack=100;boosted.squads[0].decor.hp=50;boosted.squads[0].soldierPower=100000;
const br=simulate(data,boosted);
assert.ok(br.teams[0][0].atk>r.teams[0][0].atk);
assert.ok(br.teams[0][0].maxHP>r.teams[0][0].maxHP);
for(const mutate of [x=>x.squads[0].heroes[1].id=x.squads[0].heroes[0].id,x=>x.squads[0].heroes[0].stars=6,x=>x.squads[0].soldierPower=-1,x=>x.model.seed=NaN,x=>x.model.duration=999999,x=>x.squads[0].heroes[0].level=1.5,x=>x.squads[0].heroes[0].stats={hp:0,attack:1,defense:1}]){const bad=copy(s);mutate(bad);assert.throws(()=>validate(data,bad));}
for(const hero of data.heroes){const all=copy(s);const i=all.squads[0].heroes.findIndex(h=>h.id===hero.id);all.squads[0].heroes[i<0?0:i]={...makeHero(hero.id),stars:5,starStep:25,level:150};const out=simulate(data,all);assert.ok(out.teams.flat().every(h=>Number.isFinite(h.hp)&&Number.isFinite(h.damage)),hero.display_name);}
// Legacy saves retain neutral morale, no fighter boosts, and whole-star growth.
const legacy=copy(s);for(const squad of legacy.squads){delete squad.moraleDamage;delete squad.fighter;delete squad.fighterMode;delete squad.fighterPower;delete squad.boosts;for(const hero of squad.heroes){delete hero.starStep;delete hero.finalStats;}}
assert.deepEqual(simulate(data,legacy).remaining,simulate(data,s).remaining);
const morale=copy(counter);morale.squads[0].moraleDamage=103;
assert.ok(Math.abs(simulate(data,morale).teams[0].reduce((n,h)=>n+h.damage,0)/reduced.teams[0].reduce((n,h)=>n+h.damage,0)-1.03)<1e-12);
const final=copy(boosted);final.squads[0].fighter={hp:1e6,attack:1e6,defense:1e6};
final.squads[0].heroes[0]={...final.squads[0].heroes[0],stats:{hp:123456,attack:789,defense:45},finalStats:true};
const entered=simulate(data,final).teams[0][0];
assert.equal(entered.maxHP,123456);assert.equal(entered.atk,789);assert.equal(entered.def,45);
for(const mutate of [x=>x.squads[0].moraleDamage=-1,x=>x.squads[0].fighter.attack=Infinity,x=>x.squads[0].heroes[0].starStep=26,x=>x.squads[0].heroes[0].starStep=20,x=>x.squads[0].heroes[0].finalStats=true]){const bad=copy(s);mutate(bad);assert.throws(()=>validate(data,bad));}
const research=JSON.parse(readFileSync(new URL('../combat/research.json',import.meta.url)));
const monroe=research.skills.find(r=>r.hero_id===30006&&r.slot===2);
assert.ok(Math.abs(skillValue(monroe,15,10).percent-179.2225)<1e-9);
assert.ok(skillValue(monroe,15,1).percent<skillValue(monroe,15,10).percent);
const zeros=[0,0,0,0],t1=research.soldiers.find(r=>r.id===1001),t2=research.soldiers.find(r=>r.id===1002);
assert.equal(soldierStats(t1,zeros,zeros,research.power_factors).power,25);
assert.equal(soldierStats(t2,zeros,zeros,research.power_factors).power,36);
assert.equal(t2.ability,37,'Static ability is not interchangeable with calculated power');
assert.equal(soldierStats(t1,[10,0,0,0],[20,0,0,0],research.power_factors).stats[0],(34.8+10)*1.2);
assert.equal(research.monsters.length,646);assert.equal(research.unresolved_count,165);
assert.equal(research.monsters.filter(r=>research.templates[r.attrId]===null).length,165);
assert.equal(research.templates['5124'].soldier[0].count*5,1845);
assert.equal(research.pvp.blue.power,6088937);assert.equal(research.pvp.red.heroes[2].damage_dealt,3232442);
const near=(actual,expected,note)=>assert.ok(Math.abs(actual-expected)<=1e-10*Math.max(1,Math.abs(expected)),note);
const row=(patch={})=>({source:'gear',name:'Entered gear stat',target:'all',stat:'attack',flat:0,percent:0,enabled:true,...patch});
const ledger=copy(counter),squad=ledger.squads[0],hero=squad.heroes[0];
squad.tech.attack=100;
squad.boosts=[row({target:`hero:${hero.id}`,flat:20})];
near(accountStats(data,squad,hero).stats.attack,240,'Growth 100 × (1 + 100% tech + 20% lineup) + flat gear 20');
near(accountStats(data,squad,squad.heroes[1]).stats.attack,220,'Gear targets one hero');
near(simulate(data,ledger).teams[0][0].atk,240,'The simulator consumes the composed stats');
squad.boosts.push(row({source:'hallOfFame',target:'camp:3',stat:'hp',percent:10}));
near(accountStats(data,squad,hero).stats.hp,1e8*1.3,'Warrior Hall of Fame bonus applies');
near(accountStats(data,ledger.squads[1],ledger.squads[1].heroes[0]).modifiers.physical,0,'Other squad remains independent');
squad.boosts.push(row({target:'back',stat:'defense',flat:30}));
near(accountStats(data,squad,hero).flat.defense,0);
near(accountStats(data,squad,squad.heroes[2]).flat.defense,30);
squad.fighter={hp:0,attack:100,defense:0};
squad.boosts.push(row({source:'component',flat:50}));
near(accountStats(data,squad,hero).stats.attack,340,'Summary excludes the individual component row');
squad.fighterMode='components';
near(accountStats(data,squad,hero).stats.attack,290,'Component entry excludes the fighter summary');
hero.finalStats=true;
near(accountStats(data,squad,hero).stats.attack,100,'Final stats bypass both grouped and flat boosts');
hero.finalStats=false;squad.boosts[0].enabled=false;
near(accountStats(data,squad,hero).stats.attack,270,'Disabled boost is ignored');
const physicalBoost=copy(counter);physicalBoost.squads[0].boosts=[row({stat:'physical',percent:10})];
assert.ok(Math.abs(simulate(data,physicalBoost).teams[0][0].damage/reduced.teams[0][0].damage-1.1)<1e-12,'Typed physical boost changes actual simulated hits');
const referencePower=copy(counter);referencePower.squads[0].fighterPower=9999999;
assert.deepEqual(simulate(data,referencePower).remaining,reduced.remaining,'Fighter reference power has no invented damage conversion');
for(const patch of [{flat:NaN},{percent:-1},{stat:'unknown'},{target:'hero:999999'},{source:'__proto__'},{stat:'speed',flat:1},{enabled:'yes'}]){
  const bad=copy(s);bad.squads[0].boosts=[row(patch)];assert.throws(()=>validate(data,bad));
}
const roundTrip=JSON.parse(JSON.stringify(ledger));validate(data,roundTrip);
assert.deepEqual(simulate(data,roundTrip),simulate(data,ledger),'Boost entries survive JSON backup/restore');
console.log('PASS: combat, source facts, target-specific account boosts, grouped flat/percent stats, Hall of Fame, component/summary exclusion, final overrides, typed damage boosts, JSON round trips and input rejection.');
