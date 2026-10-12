/* Price model for active queues only; not pre-start Upgrade Now purchases. */
window.ZR_SPEEDUPS=Object.freeze({
  instantCost(seconds){
    if(!Number.isFinite(seconds)||seconds<0)return null;
    return Math.ceil(180*Math.pow(seconds/3600,0.9));
  },
  // First full second where instant finish is strictly more expensive than the offer.
  cheaperAfterSeconds(cost){
    if(!Number.isFinite(cost)||cost<0)return null;
    if(cost===0)return 1;
    // For fractional modeled diamond costs, ceil(x) > cost when x > floor(cost).
    let sec=Math.max(1,Math.floor(3600*Math.pow(Math.floor(cost)/180,1/0.9))+1);
    while(this.instantCost(sec)<=cost)sec++;
    while(sec>1&&this.instantCost(sec-1)>cost)sec--;
    return sec;
  },
  formatDuration(seconds){
    if(!Number.isFinite(seconds)||seconds<0)return "—";
    const s=Math.floor(seconds),h=Math.floor(s/3600),m=Math.floor(s%3600/60),z=s%60;
    return (h?h+"h ":"")+(m||h?m+"m ":"")+z+"s";
  }
});