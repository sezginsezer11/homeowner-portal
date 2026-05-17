'use client'
import { useState, useEffect } from 'react'
import { Calculator, TrendingDown, Percent, GitCompare, ShoppingCart, Info, ChevronDown, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const LOAN_ADJ = { '30yr_fixed':0,'20yr_fixed':-0.25,'15yr_fixed':-0.75,'10yr_fixed':-1.0,'fha_30yr':0.25,'va_30yr':-0.5,'jumbo_30yr':0.25,'arm_5_1':-1.25,'arm_7_1':-0.875,'arm_10_1':-0.5 }
const LOAN_LABELS = { '30yr_fixed':'30-Year Fixed','20yr_fixed':'20-Year Fixed','15yr_fixed':'15-Year Fixed','10yr_fixed':'10-Year Fixed','fha_30yr':'FHA 30-Year','va_30yr':'VA 30-Year','jumbo_30yr':'Jumbo 30-Year','arm_5_1':'5/1 ARM','arm_7_1':'7/1 ARM','arm_10_1':'10/1 ARM' }
const LOAN_TERMS = { '30yr_fixed':360,'20yr_fixed':240,'15yr_fixed':180,'10yr_fixed':120,'fha_30yr':360,'va_30yr':360,'jumbo_30yr':360,'arm_5_1':360,'arm_7_1':360,'arm_10_1':360 }
function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US') }
function calcMonthly(p,r,m) { if(!p||!r||!m)return 0;const mr=r/100/12;return p*(mr*Math.pow(1+mr,m))/(Math.pow(1+mr,m)-1) }
function amortize(p,r,m) {
  const mr=r/100/12,pmt=calcMonthly(p,r,m);let bal=p,ti=0;
  const schedule=[];
  for(let i=1;i<=m;i++){const ip=bal*mr,pp=pmt-ip;bal=Math.max(0,bal-pp);ti+=ip;if(i%12===0||i===1||i===m)schedule.push({month:i,year:Math.ceil(i/12),payment:pmt,principal:pp,interest:ip,balance:bal,totalInterest:ti})}
  return{schedule,totalInterest:ti,totalPaid:pmt*m}
}

const TABS = [
  { id:'calculator', label:'Calculator',  icon:Calculator },
  { id:'refi',       label:'Refi Savings', icon:TrendingDown },
  { id:'rates',      label:'Live Rates',   icon:Percent },
  { id:'scenario',   label:'Compare Scenarios', icon:GitCompare },
]

// Mortgage Scenario Comparator embedded HTML
const SCENARIO_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}html{font-size:15px}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;color:#1a1a2e;-webkit-font-smoothing:antialiased;padding:0}:root{--blue:#1877F2;--navy:#0d1b2a;--gold:#c9a84c;--r:12px;--rs:8px;--green:#22c55e;--red:#ef4444}.hdr{background:#fff;padding:14px 18px;border-bottom:1px solid #e4e6eb;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;position:sticky;top:0;z-index:60;box-shadow:0 1px 4px rgba(0,0,0,.06)}.hdr-title{font-size:1.1rem;font-weight:800;color:#1a1a2e}.hdr-title em{color:var(--blue);font-style:normal}.pill{background:#e7f0fd;color:var(--blue);padding:4px 12px;border-radius:99px;font-size:.7rem;font-weight:700}.btn{display:flex;align-items:center;gap:6px;border:none;border-radius:99px;padding:8px 16px;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .15s}.btn-blue{background:var(--blue);color:#fff}.btn-blue:hover{background:#1665d8}.btn-blue:disabled{opacity:.4;cursor:not-allowed}.btn-out{background:#f0f2f5;color:#65676b;border:1px solid #e4e6eb}.btn-out:hover{background:#e4e6eb}.mode-bar{background:#fff;padding:10px 18px;border-bottom:1px solid #e4e6eb;display:flex;gap:8px;overflow-x:auto}.mode-btn{flex-shrink:0;padding:6px 14px;border-radius:99px;border:1.5px solid #e4e6eb;background:#f8f9fa;font-size:.76rem;font-weight:600;color:#65676b;cursor:pointer;transition:all .15s;white-space:nowrap}.mode-btn:hover{border-color:var(--blue);color:var(--blue)}.mode-btn.active{background:var(--blue);border-color:var(--blue);color:#fff}.shared-panel{background:#f0f7ff;border-bottom:2px solid var(--blue);padding:12px 18px;display:none}.shared-panel.show{display:block}.shared-panel h3{font-size:.65rem;font-weight:800;color:var(--blue);letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}.shared-fields{display:flex;gap:10px;flex-wrap:wrap}.sf-group{display:flex;flex-direction:column;gap:3px;min-width:120px;flex:1}.sf-lbl{font-size:.6rem;font-weight:700;color:#65676b;letter-spacing:.07em;text-transform:uppercase}.sf-inp,.sf-sel{background:#fff;border:1.5px solid #e4e6eb;border-radius:var(--rs);padding:6px 10px;font-size:.82rem;color:#1a1a2e;outline:none;transition:border-color .15s;width:100%}.sf-inp:focus,.sf-sel:focus{border-color:var(--blue)}.wrap{padding:16px 18px 60px;max-width:1400px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:14px;margin-bottom:20px}.card{background:#fff;border-radius:var(--r);box-shadow:0 2px 10px rgba(0,0,0,.07);border:2px solid transparent;overflow:hidden;transition:all .2s}.card:hover{border-color:#e7f0fd;box-shadow:0 4px 18px rgba(0,0,0,.1)}.card[data-base]{border-color:#e7f0fd}.c-head{background:#1877F2;padding:10px 14px;display:flex;align-items:center;justify-content:space-between}.c-left{display:flex;align-items:center;gap:8px}.c-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}.c-meta{font-size:.56rem;font-weight:700;color:rgba(255,255,255,.6);letter-spacing:.1em;text-transform:uppercase}.c-title{font-size:1rem;font-weight:800;color:#fff}.c-base{background:var(--gold);color:#0d1b2a;font-size:.55rem;font-weight:800;padding:2px 7px;border-radius:99px;letter-spacing:.06em;text-transform:uppercase}.btn-rm{background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;padding:4px;border-radius:6px;display:flex;align-items:center;transition:color .14s}.btn-rm:hover{color:#ff8080}.c-banner{background:linear-gradient(135deg,#f0f7ff,#e7f0fd);padding:12px 14px;text-align:center;border-bottom:1px solid #e4e6eb}.banner-lbl{font-size:.58rem;color:#65676b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:2px}.banner-amt{font-size:1.8rem;font-weight:800;color:#1877F2;line-height:1}.banner-diff{font-size:.68rem;font-weight:700;margin-top:3px}.banner-diff.higher{color:#ef4444}.banner-diff.lower{color:#22c55e}.banner-sub{font-size:.63rem;color:#65676b;margin-top:3px}.c-body{padding:14px;display:flex;flex-direction:column;gap:10px}.ig{display:flex;flex-direction:column;gap:3px}.ig.locked{opacity:.45;pointer-events:none}.ig-lbl{font-size:.6rem;font-weight:700;color:#65676b;letter-spacing:.07em;text-transform:uppercase;display:flex;align-items:center;gap:6px}.ig-lbl::after{content:'(shared)';display:none;font-style:italic;letter-spacing:0;font-weight:400;opacity:.7}.ig.locked .ig-lbl::after{display:inline}.ig-row{display:flex;gap:6px}.ig-row .sel-w{flex:1;min-width:0}.ig-row .man-w{flex:0 0 80px}.sel,.inp{width:100%;background:#fff;border:1.5px solid #e4e6eb;border-radius:var(--rs);padding:7px 9px;font-size:.82rem;color:#1a1a2e;outline:none;transition:border-color .15s;appearance:none}.sel:focus,.inp:focus{border-color:var(--blue)}.sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2365676b'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;padding-right:22px;cursor:pointer}.pfx-w{position:relative;width:100%}.pfx-w .sym{position:absolute;left:8px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:.8rem;pointer-events:none}.pfx-w .inp{padding-left:18px}.sfx-w{position:relative;width:100%}.sfx-w .sym{position:absolute;right:8px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:.8rem;pointer-events:none}.sfx-w .inp{padding-right:20px}.dp-box{background:#f8f9fa;border:1.5px solid #e4e6eb;border-radius:var(--rs);padding:10px;margin-top:2px}.dp-row{display:flex;gap:8px;align-items:center;margin-bottom:6px}.loan-disp{font-size:.75rem;color:#65676b}.loan-val{font-weight:700;color:#1a1a2e}.lt-row{display:flex;gap:5px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}.lt-row::-webkit-scrollbar{display:none}.lt-btn{font-size:.7rem;font-weight:700;padding:5px 11px;border-radius:99px;border:1.5px solid #e4e6eb;background:#f8f9fa;color:#65676b;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .15s}.lt-btn:hover{border-color:var(--blue);color:var(--blue)}.lt-btn.active.lt-conv{background:var(--blue);border-color:var(--blue);color:#fff}.lt-btn.active.lt-jumbo{background:#7c3aed;border-color:#7c3aed;color:#fff}.lt-btn.active.lt-fha{background:#16a34a;border-color:#16a34a;color:#fff}.lt-btn.active.lt-va{background:#dc2626;border-color:#dc2626;color:#fff}.lt-btn.active.lt-hard{background:#c27845;border-color:#c27845;color:#fff}.lt-note{font-size:.63rem;color:#9ca3af;padding-top:3px;font-style:italic}.pmi-sec{border-radius:var(--rs);padding:9px 11px;margin-top:2px}.pmi-active{background:#fff3e0;border:1.5px solid #fb923c40}.pmi-none{background:#f0fdf4;border:1.5px solid #22c55e40}.pmi-off{background:#f8f9fa;border:1.5px solid #e4e6eb}.pmi-chk{display:flex;align-items:center;gap:7px;font-size:.72rem;font-weight:600;color:#65676b;cursor:pointer;margin-bottom:6px}.pmi-chk input{width:14px;height:14px;accent-color:var(--blue)}.pmi-info{font-size:.7rem;color:#65676b;line-height:1.4}.mini-grid{background:#f8f9fa;border-radius:var(--rs);padding:9px 11px;display:grid;grid-template-columns:1fr 1fr;gap:6px 10px}.ms-lbl{font-size:.56rem;color:#9ca3af;letter-spacing:.07em;text-transform:uppercase}.ms-val{font-size:.84rem;font-weight:700;color:#1a1a2e;margin-top:1px}.ms-val.accent{color:var(--blue)}.divider{height:1px;background:#f0f2f5}.add-card{border-radius:var(--r);border:2px dashed #e4e6eb;background:#f8f9fa;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;cursor:pointer;min-height:160px;transition:all .2s}.add-card:hover{border-color:var(--blue);background:#e7f0fd}.add-card.disabled{opacity:.35;cursor:not-allowed;pointer-events:none}.add-icon{width:44px;height:44px;border-radius:50%;background:#e7f0fd;border:2px solid #c7d9f8;display:flex;align-items:center;justify-content:center}.add-lbl{font-size:.8rem;font-weight:700;color:var(--blue);text-align:center}.add-sub{font-size:.65rem;color:#9ca3af}.sec{background:#fff;border-radius:var(--r);box-shadow:0 2px 10px rgba(0,0,0,.07);border:1.5px solid #e4e6eb;overflow:hidden;margin-bottom:14px}.sec-hd{background:#1a1a2e;padding:12px 18px;display:flex;align-items:center;gap:10px}.sec-hd h2{font-size:1rem;font-weight:800;color:#fff}.gold-ln{flex:1;height:1px;background:linear-gradient(to right,var(--gold),transparent)}.tbl-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:.76rem}thead th{background:#1a2e45;color:#b8c6d6;font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:9px 12px;text-align:left;white-space:nowrap}thead th.col1{color:var(--gold)}tbody td{padding:9px 12px;border-bottom:1px solid #f0f2f5;white-space:nowrap}.rl{font-weight:700;color:#65676b;font-size:.68rem}.tr-tot td{background:#1a1a2e!important;color:#fff;font-weight:700;border-bottom:none}.tr-tot .rl{color:var(--gold)}.best-v{color:#22c55e;font-weight:800}.low-badge{display:inline-block;background:#dcfce7;color:#16a34a;border:1px solid #22c55e40;font-size:.54rem;font-weight:700;padding:1px 5px;border-radius:99px;margin-left:4px}.diff-hi{color:#ef4444;font-size:.68rem;font-weight:700}.diff-lo{color:#22c55e;font-size:.68rem;font-weight:700}.bk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))}.bk-card{padding:18px;border-right:1px solid #f0f2f5;border-bottom:1px solid #f0f2f5}.bk-title{font-size:.88rem;font-weight:800;color:#1a1a2e;display:flex;align-items:center;gap:6px;margin-bottom:10px}.bk-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}.bar-row{margin-bottom:7px}.bar-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px}.bar-lbl{font-size:.65rem;color:#65676b;font-weight:500}.bar-val{font-size:.7rem;font-weight:700;color:#1a1a2e}.bar-track{height:5px;background:#f0f2f5;border-radius:99px;overflow:hidden}.bar-fill{height:100%;border-radius:99px;transition:width .4s ease}.bp{background:#1877F2}.bi{background:var(--gold)}.bt{background:#8b5cf6}.bins{background:#22c55e}.bh{background:#f59e0b}.bpmi{background:#f97316}.bk-tot{margin-top:9px;padding-top:9px;border-top:1px solid #f0f2f5;display:flex;justify-content:space-between;align-items:center}.bk-tot-lbl{font-size:.63rem;color:#65676b;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.bk-tot-val{font-size:.92rem;font-weight:800;color:#1a1a2e}@media(max-width:640px){.hdr{padding:10px 12px}.wrap{padding:12px 12px 40px}.grid{grid-template-columns:1fr;gap:10px}.c-body{padding:11px;gap:8px}.add-card{min-height:120px}.banner-amt{font-size:1.5rem}.bk-grid{grid-template-columns:1fr}.bk-card{border-right:none}}</style></head><body>
<header class="hdr">
  <div class="hdr-title">Mortgage <em>Scenario</em> Comparator</div>
  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
    <span class="pill" id="count-pill">1 of 8 Scenarios</span>
    <button class="btn btn-out" id="btn-pdf">⬇ Download PDF</button>
  </div>
</header>
<div class="mode-bar">
  <button class="mode-btn active" data-mode="custom">Custom (Full Control)</button>
  <button class="mode-btn" data-mode="price">Compare by Price</button>
  <button class="mode-btn" data-mode="down">Compare by Down Payment</button>
  <button class="mode-btn" data-mode="rate">Compare by Rate</button>
</div>
<div class="shared-panel" id="shared-panel">
  <h3 id="shared-panel-title">Shared Settings</h3>
  <div class="shared-fields" id="shared-fields"></div>
</div>
<div class="wrap">
  <div class="grid" id="cards-grid"></div>
  <div id="summ-sec" class="sec" style="display:none"><div class="sec-hd"><h2>Comparison Summary</h2><div class="gold-ln"></div></div><div class="tbl-wrap"><table id="summ-tbl"></table></div></div>
  <div id="bk-sec" class="sec" style="display:none"><div class="sec-hd"><h2>Monthly Payment Breakdown</h2><div class="gold-ln"></div></div><div class="bk-grid" id="bk-grid"></div></div>
</div>
<script>
'use strict';
var LT={conventional:{label:'Conventional',cls:'lt-conv',pmiLabel:'PMI',autoPMI:true,note:'Standard conforming — PMI required below 20% down.'},jumbo:{label:'Jumbo',cls:'lt-jumbo',pmiLabel:'PMI',autoPMI:false,note:'Above conforming limit ($766,550). PMI typically not required.'},hardmoney:{label:'Hard Money',cls:'lt-hard',pmiLabel:null,autoPMI:false,interestOnly:true,note:'Asset-based short-term — interest-only payments. No PMI.'},fha:{label:'FHA',cls:'lt-fha',pmiLabel:'MIP',autoPMI:true,note:'FHA loan — MIP required for all FHA loans regardless of down payment.'},va:{label:'VA',cls:'lt-va',pmiLabel:'PMI',autoPMI:false,note:'VA loan — no monthly PMI for eligible veterans.'}};
var PMI_TBL=[[3,1.10],[5,.95],[10,.62],[15,.42],[19,.26]];
function getPMIRate(dp){if(dp>=20)return 0;var t=PMI_TBL,d=Math.max(dp,3);for(var i=0;i<t.length-1;i++){if(d>=t[i][0]&&d<=t[i+1][0]){var f=(d-t[i][0])/(t[i+1][0]-t[i][0]);return t[i][1]+f*(t[i+1][1]-t[i][1]);}}return 0;}
function calcIns(p){return p*(p<300000?.55:p<600000?.42:p<1000000?.35:p<2000000?.31:.28)/100/12;}
var S={scenarios:[],nextId:1,mode:'custom'};
var SHARED={purchasePrice:1000000,downPct:20,rate:6.5,loanTerm:30,taxRate:1.15,hoa:0,other:0};
var COLORS=['#1877F2','#c9a84c','#22c55e','#8b5cf6','#ef4444','#f59e0b','#06b6d4','#ec4899'];
var LOCKED={custom:[],price:['downPct','rate','loanTerm','taxRate','hoa','other'],down:['purchasePrice','rate','loanTerm','taxRate','hoa','other'],rate:['purchasePrice','downPct','loanTerm','taxRate','hoa','other']};
var DEFAULTS={purchasePrice:1000000,downPct:20,rate:6.5,loanTerm:30,taxRate:1.15,hoa:0,other:0,loanType:'conventional',pmiEnabled:true};
function compute(s){
  var p=+s.purchasePrice||0,dp=+s.downPct||0,r=+s.rate||0,tax=+s.taxRate||0,term=+s.loanTerm||30,hoa=+s.hoa||0,oth=+s.other||0;
  var da=p*dp/100,la=p-da,ltv=100-dp,mr=r/100/12,n=term*12;
  var isHM=s.loanType==='hardmoney';
  var pi=isHM?(mr>0?la*mr:0):(mr===0?la/n:la*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1));
  var mt=p*(tax/100)/12,ins=calcIns(p);
  var lt=LT[s.loanType]||LT.conventional;
  var pmi=0;if(s.pmiEnabled&&lt.autoPMI&&!isHM){if(s.loanType==='fha')pmi=la*.0055/12;else pmi=la*(getPMIRate(dp)/100)/12;}
  var total=pi+mt+hoa+ins+oth+pmi;
  return{p,dp,da,la,ltv,r,tax,term,hoa,oth,pi,mt,ins,pmi,total,isHM};
}
function effective(s){var locked=LOCKED[S.mode]||[];var m=Object.assign({},s);locked.forEach(function(f){m[f]=SHARED[f];});return m;}
function fmt(v){return'$'+Math.round(v||0).toLocaleString('en-US');}
function fmtD(v){return'$'+(v||0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',');}
function gid(id){return document.getElementById(id);}
function stripC(s){return(s+'').replace(/,/g,'');}
function buildCard(s,idx){
  var eff=effective(s),c=compute(eff),col=COLORS[idx%COLORS.length],sid=s.id,base=idx===0;
  var locked=LOCKED[S.mode]||[];function isLocked(f){return locked.indexOf(f)>=0;}
  var lt=LT[s.loanType]||LT.conventional,isHM=s.loanType==='hardmoney';
  var rmBtn=base?'':'<button class="btn-rm" data-remove="'+sid+'">✕</button>';
  var ltBtns=Object.keys(LT).map(function(k){return'<button class="lt-btn '+LT[k].cls+(s.loanType===k?' active':'')+'" data-sid="'+sid+'" data-lt="'+k+'">'+LT[k].label+'</button>';}).join('');
  var subParts=isHM?['IO: '+fmt(c.pi),' Tax: '+fmt(c.mt)]:['P&I: '+fmt(c.pi),' Tax: '+fmt(c.mt)];
  if(c.pmi>0)subParts.push(' '+(lt.pmiLabel||'PMI')+': '+fmt(c.pmi));
  if(c.oth>0)subParts.push(' Other: '+fmt(c.oth));
  function selOpts(arr,cur){return arr.map(function(v){return'<option value="'+v+'"'+(parseFloat(cur)===v?' selected':'')+'>'+v+'%</option>';}).join('');}
  var pmiSec='';
  if(!isHM){var sectionCls='pmi-sec '+(s.pmiEnabled?(c.pmi>0?'pmi-active':'pmi-none'):'pmi-off');
    pmiSec='<div class="ig"><div class="ig-lbl">'+(lt.pmiLabel||'PMI')+'</div><div class="'+sectionCls+'"><label class="pmi-chk"><input type="checkbox" data-sid="'+sid+'" data-type="pmi-toggle"'+(s.pmiEnabled?' checked':'')+'>Include '+(lt.pmiLabel||'PMI')+'</label>'+
    (s.pmiEnabled?'<div class="pmi-info">'+(c.pmi>0?'<strong>'+fmt(c.pmi)+'/mo</strong> ('+getPMIRate(c.dp).toFixed(2)+'% annual)':'No PMI — 20%+ down payment')+'</div>':'')+'</div></div>';}
  return'<div class="card" id="card-'+sid+'" data-sid="'+sid+'"'+(base?' data-base="1"':'')+'>'+
    '<div class="c-head"><div class="c-left"><span class="c-dot" style="background:'+col+'"></span><div><div class="c-meta">Option</div><div class="c-title">#'+(idx+1)+' '+s.name+'</div></div>'+(base?'<span class="c-base">Base</span>':'')+'</div>'+rmBtn+'</div>'+
    '<div class="c-banner"><div class="banner-lbl">Est. Monthly Payment</div><div class="banner-amt" id="ba-'+sid+'">'+fmt(c.total)+'</div>'+
    '<div class="banner-diff" id="bdiff-'+sid+'"></div>'+
    '<div class="banner-sub">'+subParts.join(' · ')+'</div></div>'+
    '<div class="c-body">'+
    '<div class="ig"><div class="ig-lbl">Loan Type</div><div class="lt-row">'+ltBtns+'</div><div class="lt-note" id="lt-note-'+sid+'">'+lt.note+'</div></div>'+
    '<div class="divider"></div>'+
    '<div class="ig'+(isLocked('purchasePrice')?' locked':'')+'"><div class="ig-lbl">Purchase Price</div><div class="pfx-w"><span class="sym">$</span><input class="inp" type="text" inputmode="numeric" id="inp-price-'+sid+'" data-sid="'+sid+'" data-type="price" value="'+Math.round(eff.purchasePrice).toLocaleString('en-US')+'"></div></div>'+
    '<div class="ig'+(isLocked('downPct')?' locked':'')+'"><div class="ig-lbl">Down Payment</div><div class="ig-row"><div class="sel-w"><select class="sel" data-sid="'+sid+'" data-field="downPct">'+selOpts([3.5,5,10,15,20,25,30,35,40,45,50],eff.downPct)+'</select></div><div class="man-w sfx-w"><span class="sym">%</span><input class="inp" type="number" min="0" max="100" step="0.5" id="inp-dp-'+sid+'" data-sid="'+sid+'" data-field="downPct" data-type="manual" value="'+eff.downPct+'"></div></div><div class="dp-box"><div class="dp-row"><span style="font-size:.65rem;color:#65676b;font-weight:600">Down $</span><div class="pfx-w" style="flex:1;margin-left:8px"><span class="sym">$</span><input class="inp" type="text" inputmode="numeric" id="inp-da-'+sid+'" data-sid="'+sid+'" data-type="downdollar" value="'+Math.round(c.da).toLocaleString('en-US')+'"></div></div><div class="loan-disp">Loan: <span class="loan-val" id="loan-disp-'+sid+'">'+fmt(c.la)+'</span></div></div></div>'+
    '<div class="ig'+(isLocked('rate')?' locked':'')+'"><div class="ig-lbl">Interest Rate</div><div class="ig-row"><div class="sel-w"><select class="sel" data-sid="'+sid+'" data-field="rate">'+[5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10].map(function(v){return'<option value="'+v+'"'+(parseFloat(eff.rate)===v?' selected':'')+'>'+v+'%</option>';}).join('')+'</select></div><div class="man-w sfx-w"><span class="sym">%</span><input class="inp" type="number" min="0" max="20" step="0.125" id="inp-r-'+sid+'" data-sid="'+sid+'" data-field="rate" data-type="manual" value="'+eff.rate+'"></div></div></div>'+
    '<div class="ig'+(isLocked('loanTerm')?' locked':'')+'"><div class="ig-lbl">Loan Term</div><select class="sel" style="width:100%" data-sid="'+sid+'" data-field="loanTerm"><option value="30"'+(eff.loanTerm==30?' selected':'')+'>30 Years</option><option value="20"'+(eff.loanTerm==20?' selected':'')+'>20 Years</option><option value="15"'+(eff.loanTerm==15?' selected':'')+'>15 Years</option><option value="10"'+(eff.loanTerm==10?' selected':'')+'>10 Years</option></select></div>'+
    '<div class="divider"></div>'+
    '<div class="ig'+(isLocked('taxRate')?' locked':'')+'"><div class="ig-lbl">Tax Rate %</div><div class="ig-row"><div class="sel-w"><select class="sel" data-sid="'+sid+'" data-field="taxRate">'+[1.05,1.10,1.15,1.20,1.25].map(function(v){return'<option value="'+v+'"'+(parseFloat(eff.taxRate)===v?' selected':'')+'>'+v+'%</option>';}).join('')+'</select></div><div class="man-w sfx-w"><span class="sym">%</span><input class="inp" type="number" min="0" max="5" step="0.01" id="inp-tx-'+sid+'" data-sid="'+sid+'" data-field="taxRate" data-type="manual" value="'+eff.taxRate+'"></div></div></div>'+
    '<div class="ig'+(isLocked('hoa')?' locked':'')+'"><div class="ig-lbl">Monthly HOA</div><div class="pfx-w"><span class="sym">$</span><input class="inp" type="number" min="0" step="50" id="inp-hoa-'+sid+'" data-sid="'+sid+'" data-field="hoa" data-type="manual" value="'+eff.hoa+'"></div></div>'+
    pmiSec+
    '<div class="ig'+(isLocked('other')?' locked':'')+'"><div class="ig-lbl">Other Monthly Fees</div><div class="pfx-w"><span class="sym">$</span><input class="inp" type="number" min="0" step="50" id="inp-oth-'+sid+'" data-sid="'+sid+'" data-field="other" data-type="manual" value="'+eff.other+'"></div></div>'+
    '<div class="divider"></div>'+
    '<div class="mini-grid"><div><div class="ms-lbl">Loan Amount</div><div class="ms-val" id="ms-la-'+sid+'">'+fmt(c.la)+'</div></div><div><div class="ms-lbl">P&I / IO</div><div class="ms-val" id="ms-pi-'+sid+'">'+fmt(c.pi)+'</div></div><div><div class="ms-lbl">Monthly Tax</div><div class="ms-val" id="ms-tx-'+sid+'">'+fmt(c.mt)+'</div></div><div><div class="ms-lbl">Total Monthly</div><div class="ms-val accent" id="ms-tot-'+sid+'">'+fmt(c.total)+'</div></div></div>'+
    '</div></div>';
}
function refreshOutputs(sid){
  var s=S.scenarios.find(function(x){return x.id===sid;});if(!s)return;
  var eff=effective(s),c=compute(eff),isHM=s.loanType==='hardmoney';
  var lt=LT[s.loanType]||LT.conventional;
  var base=S.scenarios[0],bc=compute(effective(base));
  function setText(id,v){var e=gid(id);if(e)e.textContent=v;}
  setText('ba-'+sid,fmt(c.total));setText('ms-la-'+sid,fmt(c.la));setText('ms-pi-'+sid,fmt(c.pi));setText('ms-tx-'+sid,fmt(c.mt));setText('ms-tot-'+sid,fmt(c.total));
  var disp=gid('loan-disp-'+sid);if(disp)disp.textContent=fmt(c.la);
  var ac=document.activeElement;
  var pi=gid('inp-price-'+sid);if(pi&&ac!==pi)pi.value=Math.round(eff.purchasePrice).toLocaleString('en-US');
  var dp=gid('inp-dp-'+sid);if(dp&&ac!==dp)dp.value=eff.downPct;
  var da=gid('inp-da-'+sid);if(da&&ac!==da)da.value=Math.round(c.da).toLocaleString('en-US');
  var ri=gid('inp-r-'+sid);if(ri&&ac!==ri)ri.value=eff.rate;
  var de=gid('bdiff-'+sid);
  if(de){if(s.id===base.id){de.className='banner-diff';}else{var d=c.total-bc.total;de.className='banner-diff '+(d>0.01?'higher':d<-0.01?'lower':'');de.textContent=Math.abs(d)<0.01?'= Same as #1':d>0?'↑ '+fmt(d)+'/mo more than #1':'↓ '+fmt(Math.abs(d))+'/mo less than #1';}}
  renderSummary();renderBreakdown();
}
function renderSummary(){
  var bl=gid('summ-sec');if(S.scenarios.length<2){bl.style.display='none';return;}bl.style.display='block';
  var calcs=S.scenarios.map(function(s){return{s,c:compute(effective(s))};});
  var minT=Math.min.apply(null,calcs.map(function(x){return x.c.total;}));var bc=calcs[0].c;
  var head='<thead><tr><th class="col1">Component</th>'+calcs.map(function(x,i){return'<th'+(i===0?' style="background:#b8860b22"':'')+'>'+x.s.name+'<br><small style="font-weight:400;opacity:.7;font-size:.58rem">'+(LT[x.s.loanType]||LT.conventional).label+'</small></th>';}).join('')+'</tr></thead>';
  var ROWS=[{l:'Loan Type',f:function(c,s){return(LT[s.loanType]||LT.conventional).label;}},{l:'Purchase Price',f:function(c){return fmt(c.p);}},{l:'Down Payment',f:function(c){return c.dp+'% ('+fmt(c.da)+')';}},{l:'Loan Amount',f:function(c){return fmt(c.la);}},{l:'Interest Rate',f:function(c){return c.r+'%';}},{l:'Loan Term',f:function(c){return c.term+' yrs';}},null,{l:'P&I / IO Payment',f:function(c){return fmt(c.pi);}},{l:'Monthly Tax',f:function(c){return fmt(c.mt)+' ('+c.tax+'%)';}},{l:'HOA',f:function(c){return fmt(c.hoa);}},{l:'Insurance',f:function(c){return fmt(c.ins)+'/mo';}},{l:'PMI/MIP',f:function(c,s){var lt=LT[s.loanType]||LT.conventional;return s.loanType==='hardmoney'?'N/A':c.pmi>0?fmt(c.pmi)+'/mo':'No PMI';}},{l:'Other',f:function(c){return fmt(c.oth);}},null,{l:'TOTAL MONTHLY',total:true}];
  var cols=S.scenarios.length+1,body='<tbody>';
  ROWS.forEach(function(row){
    if(!row){body+='<tr><td colspan="'+cols+'" style="padding:2px 12px;border-bottom:1px solid #f0f2f5"></td></tr>';return;}
    if(row.total){body+='<tr class="tr-tot"><td class="rl">TOTAL MONTHLY</td>';calcs.forEach(function(x,i){var best=x.c.total===minT&&S.scenarios.length>1;var d=i>0?x.c.total-bc.total:0;var diff=i>0&&Math.abs(d)>0.01?'<br><span class="'+(d>0?'diff-hi':'diff-lo')+'">'+(d>0?'↑':'↓')+fmt(Math.abs(d))+'</span>':'';body+='<td>'+(best?'<span class="best-v">'+fmt(x.c.total)+'</span><span class="low-badge">LOWEST</span>':fmt(x.c.total))+diff+'</td>';});body+='</tr>';}
    else{body+='<tr><td class="rl">'+row.l+'</td>';calcs.forEach(function(x){body+='<td>'+row.f(x.c,x.s)+'</td>';});body+='</tr>';}
  });
  body+='</tbody>';gid('summ-tbl').innerHTML=head+body;
}
function renderBreakdown(){
  gid('bk-sec').style.display='block';var html='';
  S.scenarios.forEach(function(s,idx){
    var c=compute(effective(s)),col=COLORS[idx%COLORS.length];
    var lt=LT[s.loanType]||LT.conventional,isHM=s.loanType==='hardmoney';
    var pct=function(v){return c.total>0?(v/c.total*100).toFixed(1):0;};
    var bars=[{l:isHM?'Interest Only':'Principal (1st mo)',v:c.pi,cl:'bp'},{l:'Tax',v:c.mt,cl:'bt'},{l:'Insurance',v:c.ins,cl:'bins'}];
    if(c.pmi>0)bars.push({l:lt.pmiLabel||'PMI',v:c.pmi,cl:'bpmi'});if(c.hoa>0)bars.push({l:'HOA',v:c.hoa,cl:'bh'});if(c.oth>0)bars.push({l:'Other',v:c.oth,cl:'bi'});
    html+='<div class="bk-card"><div class="bk-title"><span class="bk-dot" style="background:'+col+'"></span>#'+(idx+1)+' '+s.name+'</div>';
    bars.forEach(function(b){html+='<div class="bar-row"><div class="bar-top"><span class="bar-lbl">'+b.l+'</span><span class="bar-val">'+fmt(b.v)+' ('+pct(b.v)+'%)</span></div><div class="bar-track"><div class="bar-fill '+b.cl+'" style="width:'+pct(b.v)+'%"></div></div></div>';});
    html+='<div class="bk-tot"><span class="bk-tot-lbl">Total</span><span class="bk-tot-val">'+fmt(c.total)+'/mo</span></div></div>';
  });
  gid('bk-grid').innerHTML=html;
}
function rebuildCards(){
  var rem=8-S.scenarios.length,dis=S.scenarios.length>=8;
  var tile='<div class="add-card'+(dis?' disabled':'')+'" id="add-tile"><div class="add-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="#1877F2" stroke-width="2.2" stroke-linecap="round"/></svg></div><div class="add-lbl">Add Scenario</div><div class="add-sub">'+(dis?'Max 8 reached':rem+' slot'+(rem===1?'':'s')+' left')+'</div></div>';
  gid('cards-grid').innerHTML=S.scenarios.map(function(s,i){return buildCard(s,i);}).join('')+tile;
  gid('count-pill').textContent=S.scenarios.length+' of 8 Scenarios';
  var t=gid('add-tile');if(t&&!dis)t.addEventListener('click',addScenario);
  S.scenarios.forEach(function(s){refreshOutputs(s.id);});
}
function attachEvents(){
  var grid=gid('cards-grid');
  grid.addEventListener('change',function(e){
    var t=e.target,sid=parseInt(t.dataset.sid,10);if(!sid)return;
    var s=S.scenarios.find(function(x){return x.id===sid;});if(!s)return;
    var field=t.dataset.field,type=t.dataset.type;
    if(field&&type==='manual'){s[field]=parseFloat(t.value)||0;refreshOutputs(sid);}
    if(field&&type==='dropdown'){s[field]=parseFloat(t.value)||0;var m=gid('inp-dp-'+sid);if(m&&field==='downPct')m.value=s[field];var r=gid('inp-r-'+sid);if(r&&field==='rate')r.value=s[field];refreshOutputs(sid);}
    if(type==='pmi-toggle'){s.pmiEnabled=t.checked;rebuildCards();}
  });
  grid.addEventListener('input',function(e){
    var t=e.target,sid=parseInt(t.dataset.sid,10);if(!sid)return;
    var s=S.scenarios.find(function(x){return x.id===sid;});if(!s)return;
    if(t.dataset.type==='price'){s.purchasePrice=parseFloat(stripC(t.value))||0;refreshOutputs(sid);}
    if(t.dataset.type==='downdollar'){var n=parseFloat(stripC(t.value))||0;if(s.purchasePrice>0)s.downPct=Math.min(100,n/s.purchasePrice*100);refreshOutputs(sid);}
  });
  grid.addEventListener('focus',function(e){var t=e.target;if(t.dataset.type==='price'||t.dataset.type==='downdollar'){var r=parseFloat(stripC(t.value))||0;t.value=r>0?r:'';}},true);
  grid.addEventListener('blur',function(e){var t=e.target;if(t.dataset.type==='price'){var n=parseFloat(stripC(t.value))||0;t.value=n.toLocaleString('en-US');var sid=parseInt(t.dataset.sid,10);var s=S.scenarios.find(function(x){return x.id===sid;});if(s){s.purchasePrice=n;refreshOutputs(sid);}}if(t.dataset.type==='downdollar'){var n=parseFloat(stripC(t.value))||0;t.value=n.toLocaleString('en-US');}},true);
  grid.addEventListener('click',function(e){
    var rm=e.target.closest('[data-remove]');
    if(rm){var sid=parseInt(rm.dataset.remove,10);S.scenarios=S.scenarios.filter(function(x){return x.id!==sid;});S.scenarios.forEach(function(x,i){if(i>0)x.name='Option '+(i+1);});rebuildCards();return;}
    var ltBtn=e.target.closest('[data-lt]');
    if(ltBtn){var sid=parseInt(ltBtn.dataset.sid,10);var s=S.scenarios.find(function(x){return x.id===sid;});if(s){var lt=LT[ltBtn.dataset.lt]||LT.conventional;s.loanType=ltBtn.dataset.lt;s.pmiEnabled=lt.autoPMI;rebuildCards();}}
  });
}
function attachSharedEvents(){
  var sf=gid('shared-fields');if(!sf)return;
  sf.querySelectorAll('[data-sfield]').forEach(function(el){
    el.addEventListener('change',function(){
      var f=el.dataset.sfield,v=parseFloat(stripC(el.value))||0;
      SHARED[f]=v;S.scenarios.forEach(function(s){refreshOutputs(s.id);});
    });
  });
}
function setMode(mode){
  S.mode=mode;
  document.querySelectorAll('.mode-btn').forEach(function(b){b.classList.toggle('active',b.dataset.mode===mode);});
  var panel=gid('shared-panel');
  if(mode==='custom'){panel.classList.remove('show');}
  else{
    panel.classList.add('show');
    var titles={price:'Each card has its own Purchase Price — everything else shared',down:'Each card has its own Down Payment',rate:'Each card has its own Interest Rate'};
    gid('shared-panel-title').textContent=titles[mode]||'Shared Settings';
    var fields=[mode!=='price'?{k:'purchasePrice',l:'Purchase Price',t:'price'}:null,mode!=='down'?{k:'downPct',l:'Down %',t:'pct'}:null,mode!=='rate'?{k:'rate',l:'Rate %',t:'pct'}:null,{k:'loanTerm',l:'Term',t:'term'},{k:'taxRate',l:'Tax %',t:'pct'},{k:'hoa',l:'HOA/mo',t:'money'},{k:'other',l:'Other/mo',t:'money'}].filter(Boolean);
    gid('shared-fields').innerHTML=fields.map(function(f){
      var v=SHARED[f.k];
      var inp=f.t==='price'?'<div style="position:relative"><span style="position:absolute;left:8px;top:50%;transform:translateY(-50%);color:#9ca3af;font-size:.78rem">$</span><input class="sf-inp" type="text" inputmode="numeric" data-sfield="'+f.k+'" style="padding-left:18px" value="'+v.toLocaleString('en-US')+'"></div>':f.t==='pct'?'<input class="sf-inp" type="number" step="0.25" data-sfield="'+f.k+'" value="'+v+'">':f.t==='money'?'<input class="sf-inp" type="number" step="50" data-sfield="'+f.k+'" value="'+v+'">':f.t==='term'?'<select class="sf-sel" data-sfield="'+f.k+'"><option value="30"'+(v==30?' selected':'')+'>30yr</option><option value="20"'+(v==20?' selected':'')+'>20yr</option><option value="15"'+(v==15?' selected':'')+'>15yr</option><option value="10"'+(v==10?' selected':'')+'>10yr</option></select>':'';
      return'<div class="sf-group"><div class="sf-lbl">'+f.l+'</div>'+inp+'</div>';
    }).join('');
    attachSharedEvents();
  }
  rebuildCards();
}
function addScenario(){
  if(S.scenarios.length>=8)return;
  var last=S.scenarios[S.scenarios.length-1];
  var ns=Object.assign({},DEFAULTS,last,{id:S.nextId++,name:'Option '+(S.scenarios.length+1)});
  S.scenarios.push(ns);rebuildCards();
  setTimeout(function(){var c=gid('card-'+ns.id);if(c)c.scrollIntoView({behavior:'smooth',block:'nearest'});},50);
}
document.addEventListener('DOMContentLoaded',function(){
  var first=Object.assign({},DEFAULTS,{id:S.nextId++,name:'Option 1'});S.scenarios.push(first);
  rebuildCards();attachEvents();
  document.querySelectorAll('.mode-btn').forEach(function(b){b.addEventListener('click',function(){setMode(b.dataset.mode);});});
  gid('btn-pdf').addEventListener('click',function(){
    var calcs=S.scenarios.map(function(s){return{s,c:compute(effective(s))};});
    var min=Math.min.apply(null,calcs.map(function(x){return x.c.total;}));
    var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Mortgage Scenarios</title><style>body{font-family:Arial,sans-serif;font-size:10px;color:#1a1a2e;padding:20px}h1{font-size:15px;margin-bottom:10px}.cards{display:flex;flex-wrap:wrap;gap:10px}.card{border:1px solid #ddd;border-radius:8px;overflow:hidden;min-width:160px;flex:1}.ch{background:#1877F2;color:#fff;padding:8px 10px;font-weight:700;font-size:11px}.ct{background:#e7f0fd;color:#1877F2;font-size:14px;font-weight:800;padding:8px 10px;text-align:center}table{width:100%;border-collapse:collapse}td{padding:4px 8px;border-bottom:1px solid #f0f2f5;font-size:9px}td:last-child{text-align:right;font-weight:700}.tot td{background:#1a1a2e;color:#fff;font-weight:800;border-bottom:none}.best{color:#22c55e}@media print{@page{size:landscape;margin:10mm}}</style></head><body>'+
      '<h1>Mortgage Scenario Comparison</h1><div class="cards">'+
      calcs.map(function(x,i){var c=x.c,s=x.s,lt=LT[s.loanType]||LT.conventional;return'<div class="card"><div class="ch">#'+(i+1)+' '+s.name+' — '+lt.label+'</div><div class="ct">'+fmt(c.total)+'/mo</div><table><tr><td>Purchase Price</td><td>'+fmt(c.p)+'</td></tr><tr><td>Down Payment</td><td>'+c.dp+'% ('+fmt(c.da)+')</td></tr><tr><td>Loan Amount</td><td>'+fmt(c.la)+'</td></tr><tr><td>Interest Rate</td><td>'+c.r+'%</td></tr><tr><td>P&I</td><td>'+fmt(c.pi)+'</td></tr><tr><td>Monthly Tax</td><td>'+fmt(c.mt)+'</td></tr><tr><td>HOA</td><td>'+fmt(c.hoa)+'</td></tr><tr><td>PMI</td><td>'+(c.pmi>0?fmt(c.pmi):'None')+'</td></tr><tr class="tot"><td>TOTAL</td><td>'+(c.total===min&&calcs.length>1?'<span class="best">'+fmt(c.total)+' ★</span>':fmt(c.total))+'</td></tr></table></div>';}).join('')+
      '</div><script>window.onload=function(){window.print();}<\/script></body></html>';
    var w=window.open('','_blank');if(w){w.document.write(html);w.document.close();}
  });
});
</script></body></html>`

export default function MortgageClient({ currentRate, properties }) {
  const [tab, setTab] = useState('calculator')

  // Calculator state
  const [homePrice, setHomePrice]       = useState(800000)
  const [downPct, setDownPct]           = useState(20)
  const [loanType, setLoanType]         = useState('30yr_fixed')
  const [propertyTax, setPropertyTax]   = useState(1.25)
  const [insurance, setInsurance]       = useState(1200)
  const [hoa, setHoa]                   = useState(0)
  const [extraPayment, setExtraPayment] = useState(0)
  const [showAmort, setShowAmort]       = useState(false)

  // Refi state
  const [selectedProp, setSelectedProp] = useState(properties[0] || null)
  const [newLoanType, setNewLoanType]   = useState('15yr_fixed')
  const [closingCosts, setClosingCosts] = useState(5000)
  const [cashOut, setCashOut]           = useState(0)

  const downPayment   = homePrice * (downPct / 100)
  const loanAmount    = homePrice - downPayment
  const rate          = currentRate + (LOAN_ADJ[loanType] || 0)
  const months        = LOAN_TERMS[loanType] || 360
  const monthlyPI     = calcMonthly(loanAmount, rate, months)
  const monthlyTax    = (homePrice * propertyTax / 100) / 12
  const monthlyIns    = insurance / 12
  const monthlyPMI    = downPct < 20 ? (loanAmount * 0.85 / 100) / 12 : 0
  const totalMonthly  = monthlyPI + monthlyTax + monthlyIns + monthlyPMI + (hoa || 0)
  const { schedule, totalInterest, totalPaid } = amortize(loanAmount, rate, months)

  // Extra payment savings
  let extraMonths = months, extraSavings = 0, monthsSaved = 0
  if (extraPayment > 0) {
    let bal = loanAmount, m = 0, r = rate / 100 / 12
    while (bal > 0 && m < months * 2) { bal = bal * (1 + r) - (monthlyPI + extraPayment); m++ }
    extraMonths = m; monthsSaved = months - m
    extraSavings = totalInterest - amortize(loanAmount, rate, m).totalInterest
  }

  // Refi
  const currentLoanBal  = selectedProp?.loan_balance || 0
  const currentLoanRate = selectedProp?.loan_rate || currentRate
  const newRate         = currentRate + (LOAN_ADJ[newLoanType] || 0)
  const newMonths       = LOAN_TERMS[newLoanType] || 360
  const newLoanBalance  = currentLoanBal + cashOut
  const currentPayment  = calcMonthly(currentLoanBal, currentLoanRate, 360)
  const newPayment      = calcMonthly(newLoanBalance, newRate, newMonths)
  const monthlySavings  = currentPayment - newPayment
  const breakEven       = monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : null
  const lifetimeSavings = monthlySavings > 0 ? (monthlySavings * newMonths) - closingCosts : (newPayment * newMonths) - (currentPayment * 360)

  const inp = "w-full px-3 py-2.5 bg-white border border-[#e4e6eb] rounded-xl text-[#1a1a2e] placeholder-[#9ca3af] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20 transition-all text-sm"
  const lbl = "block text-xs font-semibold text-[#65676b] mb-1.5 uppercase tracking-wider"

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2">
          <Calculator className="w-6 h-6 text-[#1877F2]" /> Mortgage Center
        </h1>
        <p className="text-[#65676b] text-sm mt-0.5">Calculate payments, compare loans, and analyze refinancing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-[#e4e6eb] rounded-2xl p-1 shadow-card overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                tab === t.id ? 'bg-[#1877F2] text-white shadow-sm' : 'text-[#65676b] hover:text-[#1a1a2e] hover:bg-[#f0f2f5]'
              }`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* CALCULATOR TAB */}
      {tab === 'calculator' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5 space-y-4">
              <h2 className="text-[#1a1a2e] font-bold text-sm">Loan Details</h2>
              <div>
                <label className={lbl}>Home Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                  <input type="number" value={homePrice} onChange={e => setHomePrice(+e.target.value)} className={`${inp} pl-7`} />
                </div>
                <input type="range" min="100000" max="5000000" step="10000" value={homePrice} onChange={e => setHomePrice(+e.target.value)} className="w-full mt-2 accent-[#1877F2]" />
              </div>
              <div>
                <label className={lbl}>Down Payment — {downPct}% ({fmt(downPayment)})</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {[5,10,15,20,25,30].map(p => (
                    <button key={p} onClick={() => setDownPct(p)}
                      className={`flex-1 min-w-0 py-1.5 rounded-lg text-xs font-bold transition-all ${downPct===p?'bg-[#1877F2] text-white':'bg-[#f0f2f5] text-[#65676b] hover:bg-[#e7f0fd] hover:text-[#1877F2]'}`}>{p}%</button>
                  ))}
                </div>
                <input type="range" min="3" max="50" step="1" value={downPct} onChange={e => setDownPct(+e.target.value)} className="w-full accent-[#1877F2]" />
              </div>
              <div>
                <label className={lbl}>Loan Type</label>
                <div className="relative">
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <select value={loanType} onChange={e => setLoanType(e.target.value)} className={`${inp} appearance-none cursor-pointer pr-8`}>
                    {Object.entries(LOAN_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#9ca3af] text-xs">Rate for this loan</span>
                  <span className="text-[#1877F2] font-bold text-sm">{rate.toFixed(3)}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Property Tax %</label>
                  <input type="number" step="0.01" value={propertyTax} onChange={e => setPropertyTax(+e.target.value)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Insurance/yr</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input type="number" value={insurance} onChange={e => setInsurance(+e.target.value)} className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>HOA/mo</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input type="number" value={hoa} onChange={e => setHoa(+e.target.value)} className={`${inp} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Extra Payment/mo</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span>
                    <input type="number" value={extraPayment} onChange={e => setExtraPayment(+e.target.value)} className={`${inp} pl-7`} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-br from-[#1877F2] to-[#1665d8] rounded-2xl p-5 text-center">
                <div className="text-white/70 text-xs uppercase tracking-wider mb-1">Total Monthly Payment</div>
                <div className="text-5xl font-bold text-white">{fmt(totalMonthly)}</div>
                <div className="text-white/60 text-xs mt-1">per month</div>
                <div className="space-y-2 mt-4 pt-4 border-t border-white/20">
                  {[
                    { label:'Principal & Interest', value:monthlyPI,  color:'bg-white' },
                    { label:'Property Tax',          value:monthlyTax, color:'bg-yellow-300' },
                    { label:'Home Insurance',         value:monthlyIns, color:'bg-green-300' },
                    ...(monthlyPMI>0?[{label:'PMI',value:monthlyPMI,color:'bg-red-300'}]:[]),
                    ...(hoa>0?[{label:'HOA',value:hoa,color:'bg-purple-300'}]:[]),
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${item.color}`} /><span className="text-white/70 text-xs">{item.label}</span></div>
                      <span className="text-white text-xs font-bold">{fmt(item.value)}/mo</span>
                    </div>
                  ))}
                </div>
                <div className="flex rounded-full overflow-hidden h-1.5 mt-3">
                  <div className="bg-white" style={{width:`${(monthlyPI/totalMonthly)*100}%`}} />
                  <div className="bg-yellow-300" style={{width:`${(monthlyTax/totalMonthly)*100}%`}} />
                  <div className="bg-green-300" style={{width:`${(monthlyIns/totalMonthly)*100}%`}} />
                  {monthlyPMI>0 && <div className="bg-red-300" style={{width:`${(monthlyPMI/totalMonthly)*100}%`}} />}
                  {hoa>0 && <div className="bg-purple-300" style={{width:`${(hoa/totalMonthly)*100}%`}} />}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
                <h3 className="text-[#1a1a2e] font-bold text-sm mb-3">Loan Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {label:'Loan Amount',  value:fmt(loanAmount)},
                    {label:'Down Payment', value:fmt(downPayment)},
                    {label:'Interest Rate',value:`${rate.toFixed(3)}%`},
                    {label:'Loan Term',    value:LOAN_LABELS[loanType]},
                    {label:'Total Interest',value:fmt(totalInterest)},
                    {label:'Total Cost',   value:fmt(totalPaid+downPayment)},
                  ].map(({label,value}) => (
                    <div key={label} className="bg-[#f8f9fa] rounded-xl p-3">
                      <div className="text-[#9ca3af] text-[10px] uppercase tracking-wider">{label}</div>
                      <div className="text-[#1a1a2e] font-bold text-sm mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {extraPayment > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <h3 className="text-green-700 font-bold text-sm mb-2 flex items-center gap-2"><TrendingDown className="w-4 h-4" />Extra Payment Savings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-3"><div className="text-[#9ca3af] text-[10px] uppercase">Interest Saved</div><div className="text-green-600 font-bold text-lg">{fmt(extraSavings)}</div></div>
                    <div className="bg-white rounded-xl p-3"><div className="text-[#9ca3af] text-[10px] uppercase">Time Saved</div><div className="text-green-600 font-bold text-lg">{Math.floor(monthsSaved/12)}y {monthsSaved%12}m</div></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amortization */}
          <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card overflow-hidden">
            <button onClick={() => setShowAmort(!showAmort)} className="w-full flex items-center justify-between px-5 py-4 text-[#1a1a2e] font-bold text-sm hover:bg-[#f8f9fa] transition-colors">
              <span>Amortization Schedule</span>
              <ChevronDown className={`w-4 h-4 text-[#9ca3af] transition-transform ${showAmort?'rotate-180':''}`} />
            </button>
            {showAmort && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-t border-[#e4e6eb]">{['Year','Payment','Principal','Interest','Balance','Total Interest'].map(h=><th key={h} className="px-4 py-3 text-left text-[#9ca3af] uppercase tracking-wider font-semibold bg-[#f8f9fa] whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{schedule.map((row,i)=>(
                    <tr key={i} className="border-t border-[#f0f2f5] hover:bg-[#f8f9fa]">
                      <td className="px-4 py-2.5 text-[#1a1a2e] font-bold">Yr {row.year}</td>
                      <td className="px-4 py-2.5 text-[#1a1a2e]">{fmt(row.payment)}</td>
                      <td className="px-4 py-2.5 text-green-600">{fmt(row.principal)}</td>
                      <td className="px-4 py-2.5 text-red-500">{fmt(row.interest)}</td>
                      <td className="px-4 py-2.5 text-[#1a1a2e]">{fmt(row.balance)}</td>
                      <td className="px-4 py-2.5 text-[#65676b]">{fmt(row.totalInterest)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REFI TAB */}
      {tab === 'refi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5 space-y-4">
              <h2 className="text-[#1a1a2e] font-bold text-sm">Refinance Details</h2>
              {properties.length > 0 && (
                <div>
                  <label className={lbl}>Your Property</label>
                  <div className="relative"><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                    <select value={selectedProp?.id||''} onChange={e => setSelectedProp(properties.find(p=>p.id===e.target.value))} className={`${inp} appearance-none cursor-pointer pr-8`}>
                      {properties.map(p=><option key={p.id} value={p.id}>{p.address}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="bg-[#f8f9fa] rounded-xl p-4">
                <div className="text-xs font-bold text-[#65676b] uppercase tracking-wider mb-3">Current Loan</div>
                <div className="grid grid-cols-2 gap-3">
                  {[{l:'Balance',v:fmt(currentLoanBal)},{l:'Rate',v:`${currentLoanRate}%`},{l:'Monthly P&I',v:fmt(currentPayment)},{l:'Type',v:selectedProp?.loan_type||'—'}].map(({l,v})=>(
                    <div key={l}><div className="text-[#9ca3af] text-[10px]">{l}</div><div className="text-[#1a1a2e] font-bold text-sm">{v}</div></div>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>New Loan Type</label>
                <div className="relative"><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
                  <select value={newLoanType} onChange={e => setNewLoanType(e.target.value)} className={`${inp} appearance-none cursor-pointer pr-8`}>
                    {Object.entries(LOAN_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#9ca3af] text-xs">New rate</span>
                  <span className="text-[#1877F2] font-bold text-sm">{newRate.toFixed(3)}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Closing Costs</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span><input type="number" value={closingCosts} onChange={e=>setClosingCosts(+e.target.value)} className={`${inp} pl-7`}/></div></div>
                <div><label className={lbl}>Cash Out</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af] text-sm">$</span><input type="number" value={cashOut} onChange={e=>setCashOut(+e.target.value)} className={`${inp} pl-7`}/></div></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
                <h3 className="text-[#1a1a2e] font-bold text-sm mb-4">Payment Comparison</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#f8f9fa] rounded-xl p-4 text-center"><div className="text-[#9ca3af] text-xs uppercase tracking-wider mb-1">Current</div><div className="text-2xl font-bold text-[#1a1a2e]">{fmt(currentPayment)}</div><div className="text-[#9ca3af] text-xs mt-1">{currentLoanRate}% rate</div></div>
                  <div className="bg-[#e7f0fd] border border-[#1877F2]/20 rounded-xl p-4 text-center"><div className="text-[#1877F2] text-xs uppercase tracking-wider mb-1">New</div><div className="text-2xl font-bold text-[#1a1a2e]">{fmt(newPayment)}</div><div className="text-[#9ca3af] text-xs mt-1">{newRate.toFixed(3)}% rate</div></div>
                </div>
                <div className={`rounded-xl p-4 text-center ${monthlySavings>0?'bg-green-50 border border-green-200':'bg-red-50 border border-red-200'}`}>
                  <div className="text-xs uppercase tracking-wider mb-1 text-[#65676b]">Monthly Difference</div>
                  <div className={`text-3xl font-bold ${monthlySavings>0?'text-green-600':'text-red-500'}`}>{monthlySavings>0?'+':''}{fmt(Math.abs(monthlySavings))}</div>
                  <div className="text-xs text-[#65676b] mt-1">{monthlySavings>0?'saved per month':'more per month'}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
                <h3 className="text-[#1a1a2e] font-bold text-sm mb-3">Analysis</h3>
                <div className="space-y-3">
                  {[
                    {label:'Break-Even',value:breakEven?`${breakEven} months (${(breakEven/12).toFixed(1)} yrs)`:'N/A',color:breakEven&&breakEven<36?'text-green-600':'text-[#c9a84c]'},
                    {label:'Lifetime Savings',value:fmt(Math.abs(lifetimeSavings)),color:lifetimeSavings>0?'text-green-600':'text-red-500'},
                    {label:'New Balance',value:fmt(newLoanBalance),color:'text-[#1a1a2e]'},
                    {label:'Rate Diff',value:`${(currentLoanRate-newRate).toFixed(3)}%`,color:currentLoanRate>newRate?'text-green-600':'text-red-500'},
                  ].map(item=>(
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#f0f2f5] last:border-0">
                      <span className="text-[#65676b] text-xs">{item.label}</span>
                      <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl p-4 border ${monthlySavings>0&&breakEven&&breakEven<36?'bg-green-50 border-green-200':monthlySavings>0?'bg-[#e7f0fd] border-[#1877F2]/20':'bg-red-50 border-red-200'}`}>
                <div className={`text-sm font-bold mb-1 ${monthlySavings>0&&breakEven&&breakEven<36?'text-green-600':monthlySavings>0?'text-[#1877F2]':'text-red-500'}`}>
                  {monthlySavings>0&&breakEven&&breakEven<36?'✅ Strong Refi Candidate':monthlySavings>0?'⚠️ Possible Opportunity':'❌ Not Beneficial'}
                </div>
                <p className="text-[#65676b] text-xs">
                  {monthlySavings>0&&breakEven&&breakEven<36?`Save ${fmt(monthlySavings)}/mo, break even in ${breakEven} months, lifetime savings: ${fmt(lifetimeSavings)}.`:monthlySavings>0?`Save ${fmt(monthlySavings)}/mo but break-even is ${breakEven} months. Consider how long you plan to stay.`:'The new rate is higher than your current rate — not recommended.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE RATES TAB */}
      {tab === 'rates' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#1877F2] to-[#1665d8] rounded-2xl p-6 text-center">
            <div className="text-white/70 text-xs uppercase tracking-wider mb-2">30-Year Fixed — Freddie Mac National Average</div>
            <div className="text-6xl font-bold text-white">{currentRate}%</div>
            <div className="text-white/60 text-sm mt-2">Updated Weekly</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(LOAN_LABELS).map(([key,label]) => {
              const r = (currentRate + (LOAN_ADJ[key]||0)).toFixed(3)
              const diff = LOAN_ADJ[key]||0
              const payment = calcMonthly(500000, +r, LOAN_TERMS[key]||360)
              return (
                <div key={key} className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4 hover:shadow-cardHv transition-all">
                  <div className="text-[#65676b] text-xs font-semibold mb-2">{label}</div>
                  <div className="text-2xl font-bold text-[#1877F2]">{r}%</div>
                  <div className={`text-xs mt-1 font-semibold ${diff<0?'text-green-600':diff>0?'text-red-500':'text-[#9ca3af]'}`}>
                    {diff===0?'Base rate':diff>0?`+${diff}% vs 30yr`:`${diff}% vs 30yr`}
                  </div>
                  <div className="text-[#9ca3af] text-xs mt-2">{fmt(payment)}/mo on $500K</div>
                </div>
              )
            })}
          </div>
          <Link href="/dashboard/homeowner/rates"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-2xl font-bold text-sm transition-colors shadow-sm">
            <ShoppingCart className="w-4 h-4" /> Shop Rates — Find Lenders for These Programs
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <div className="bg-[#f8f9fa] border border-[#e4e6eb] rounded-xl p-3">
            <p className="text-[#9ca3af] text-xs flex items-start gap-2"><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />Rates are estimates based on Freddie Mac data. Contact a licensed lender for personalized quotes.</p>
          </div>
        </div>
      )}

      {/* SCENARIO COMPARATOR TAB */}
      {tab === 'scenario' && (
        <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card overflow-hidden" style={{height:'85vh'}}>
          <iframe
            srcDoc={SCENARIO_HTML}
            className="w-full h-full border-0"
            title="Mortgage Scenario Comparator"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}
    </div>
  )
}
