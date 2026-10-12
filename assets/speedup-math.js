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
  // Approximate time when the average instant diamond cost/minute reaches
  // a SHOP item's normalized diamond-equivalent cost/minute. This compares
  // RATES, not the price of buying one item to finish a short queue.
  // 180 * hours^0.9 / (60 * hours) = 3 * hours^-0.1.
  averageRatePerMinute(hours){
    return hours>0 && Number.isFinite(hours)?3*Math.pow(hours,-0.1):null;
  },
  rateParitySeconds(shopRate){
    if(!(shopRate>0)||!Number.isFinite(shopRate))return null;
    const hours=Math.pow(3/shopRate,10);
    // Predictions beyond a century are not credible and overflow is possible.
    if(!Number.isFinite(hours)||hours>24*365.25*100)return Infinity;
    return 3600*hours;
  },
  formatParity(seconds){
    if(seconds===Infinity)return ">100 years";
    if(seconds==null||!Number.isFinite(seconds)||seconds<0)return "—";
    // Nearest minute: the in-game ceil-to-whole-diamonds step can vary by seconds.
    const wholeMinutes=Math.round(seconds/60);
    const days=Math.floor(wholeMinutes/1440),hours=Math.floor(wholeMinutes%1440/60),mins=wholeMinutes%60;
    return (days?days.toLocaleString("en-US")+"d ":"")+(hours||days?hours+"h ":"")+mins+"m";
  },
  formatDuration(seconds){
    if(!Number.isFinite(seconds)||seconds<0)return "—";
    const s=Math.floor(seconds),h=Math.floor(s/3600),m=Math.floor(s%3600/60),z=s%60;
    return (h?h+"h ":"")+(m||h?m+"m ":"")+z+"s";
  }
});