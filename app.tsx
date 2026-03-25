import { useState, useMemo } from "react";

const RESORTS = ["Animal Kingdom","Aulani","Bay Lake Tower","Beach Club","Boardwalk","Boulder Ridge","Copper Creek","Grand Floridian","Hilton Head","Old Key West","Polynesian","Rivera Resort","Saratoga","Vero Beach"];
const AFFILIATES = ["Garrett","Robbie","Julie","Katie"];
const STATUSES = ["Under Review","Offer Submitted","Under Contract","Closed","No Deal"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ROFR_STATUSES = ["Pending","Waived","Exercised"];

const DUES = {"Animal Kingdom":10.16,"Aulani":10.95,"Bay Lake Tower":8.74,"Beach Club":9.81,"Boardwalk":9.67,"Boulder Ridge":9.76,"Copper Creek":9.02,"Grand Floridian":8.31,"Hilton Head":12.86,"Old Key West":11.20,"Polynesian":8.33,"Rivera Resort":9.18,"Saratoga":9.18,"Vero Beach":14.89};
const OFFER_RANGE = {"Animal Kingdom":[100,108],"Aulani":[90,105],"Bay Lake Tower":[115,130],"Beach Club":[120,130],"Boardwalk":[110,120],"Boulder Ridge":[90,105],"Copper Creek":[120,130],"Grand Floridian":[150,165],"Hilton Head":[55,65],"Old Key West":[75,85],"Polynesian":[150,165],"Rivera Resort":[85,100],"Saratoga":[85,100],"Vero Beach":[40,55]};
const RESALE_RANGE = {"Animal Kingdom":[95,105],"Aulani":[85,95],"Bay Lake Tower":[120,135],"Beach Club":[110,125],"Boardwalk":[110,115],"Boulder Ridge":[90,100],"Copper Creek":[110,120],"Grand Floridian":[150,160],"Hilton Head":[55,65],"Old Key West":[75,85],"Polynesian":[150,160],"Rivera Resort":[85,95],"Saratoga":[85,95],"Vero Beach":[36,44]};

const STATUS_COLORS = {"Under Review":"#D97706","Offer Submitted":"#2563EB","Under Contract":"#7C3AED","Closed":"#059669","No Deal":"#DC2626"};

const makeContract = (resort="Animal Kingdom") => ({
  id: Date.now() + Math.random(),
  resort, affiliate: "Garrett", status: "Under Review",
  listingId: "", listingLink: "", annualPoints: 160,
  pts2025: 0, pts2026: 0, pts2027: 0, totalPoints: 0,
  duesPerPt: DUES[resort] || 10, duesAnnual: 0,
  listPrice: 0, listPrPt: 0,
  offerPrPt: OFFER_RANGE[resort]?.[0] || 100, offerPrice: 0,
  negGap: 0,
  resalePrPt: RESALE_RANGE[resort]?.[0] || 95, resalePrice: 0,
  contractSpread: 0, useYear: "Jan", deedExpire: 2060,
  yearsRemaining: 0, dateAdded: new Date().toISOString().slice(0,10),
  dateOfferSubmitted: "", dateOfferAccepted: "",
  holdPeriod: 6, pointResaleTarget: 20, totalIncome: 0,
  realtorFee: 7, realtorCost: 0, closingCosts: 0,
  totalCost: 0, netProfit: 0, roi: 0, irr: 0,
  earnestMoney: 0, dateEarnestSubmitted: "", rofrStatus: "Pending", rofrDate: "", closingDate: "",
});

const recalc = (c) => {
  let n = {...c};
  n.duesPerPt = DUES[n.resort] || 10;
  n.totalPoints = (Number(n.pts2025)||0) + (Number(n.pts2026)||0) + (Number(n.pts2027)||0);
  n.duesAnnual = n.duesPerPt * (Number(n.annualPoints)||0);
  n.offerPrice = (Number(n.offerPrPt)||0) * (Number(n.annualPoints)||0);
  n.negGap = (Number(n.listPrice)||0) - n.offerPrice;
  n.resalePrice = (Number(n.resalePrPt)||0) * (Number(n.annualPoints)||0);
  n.contractSpread = n.resalePrice - n.offerPrice;
  n.totalIncome = n.totalPoints * (Number(n.pointResaleTarget)||0);
  n.realtorCost = (Number(n.realtorFee)||0) / 100 * n.resalePrice;
  n.totalCost = (Number(n.closingCosts)||0) + n.duesAnnual + n.realtorCost;
  n.netProfit = n.contractSpread + n.totalIncome - n.totalCost;
  n.roi = n.offerPrice > 0 ? n.netProfit / n.offerPrice : 0;
  const hold = Number(n.holdPeriod) || 6;
  n.irr = n.offerPrice > 0 ? (Math.pow(1 + n.roi, 12/hold) - 1) : 0;
  const mIdx = MONTHS.indexOf(n.useYear);
  const curYear = new Date().getFullYear();
  const curMonth = new Date().getMonth();
  const expYear = Number(n.deedExpire) || curYear;
  n.yearsRemaining = Math.max(0, expYear - curYear + (mIdx >= curMonth ? 0 : -1));
  n.listPrPt = (Number(n.annualPoints)||0) > 0 ? (Number(n.listPrice)||0) / n.annualPoints : 0;
  return n;
};

const fmt = (v) => typeof v === 'number' ? (Math.abs(v) >= 1000 ? '$' + v.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0}) : '$' + v.toFixed(2)) : v;
const fmtPct = (v) => (v * 100).toFixed(1) + '%';
const rangeColor = (val, range) => { if (!range) return {}; if (val < range[0]) return {color:'#059669'}; if (val > range[1]) return {color:'#DC2626'}; return {}; };
const spreadColor = (val) => val < 0 ? {color:'#DC2626'} : {};

const S = {
  app: {fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',background:'#F1F5F9',minHeight:'100vh',color:'#1E293B',padding:'20px 24px'},
  header: {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px',flexWrap:'wrap',gap:'12px'},
  h1: {fontSize:'22px',fontWeight:700,color:'#0F172A',margin:0,letterSpacing:'-0.3px'},
  tabs: {display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'16px'},
  tab: {background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:'8px',padding:'14px 18px',minWidth:'135px',textAlign:'center'},
  tabVal: {fontSize:'20px',fontWeight:700,margin:'2px 0'},
  tabLabel: {fontSize:'10px',color:'#64748B',textTransform:'uppercase',letterSpacing:'0.8px',fontWeight:500},
  table: {width:'100%',borderCollapse:'collapse',fontSize:'12.5px'},
  th: {background:'#F8FAFC',padding:'10px 10px',textAlign:'left',fontWeight:600,fontSize:'10.5px',textTransform:'uppercase',letterSpacing:'.6px',color:'#64748B',borderBottom:'1px solid #E2E8F0'},
  td: {padding:'9px 10px',borderBottom:'1px solid #F1F5F9',cursor:'pointer'},
  row: {background:'#FFFFFF',transition:'background .1s'},
  rowHover: {background:'#F8FAFC'},
  btn: {background:'#0F172A',color:'#fff',border:'none',borderRadius:'6px',padding:'9px 18px',fontWeight:600,cursor:'pointer',fontSize:'13px'},
  btnSec: {background:'#FFFFFF',color:'#475569',border:'1px solid #CBD5E1',borderRadius:'6px',padding:'8px 16px',cursor:'pointer',fontSize:'12.5px',fontWeight:500},
  input: {background:'#FFFFFF',border:'1px solid #D1D5DB',borderRadius:'5px',padding:'7px 10px',color:'#1E293B',fontSize:'13px',width:'100%',boxSizing:'border-box'},
  select: {background:'#FFFFFF',border:'1px solid #D1D5DB',borderRadius:'5px',padding:'7px 10px',color:'#1E293B',fontSize:'13px',width:'100%',boxSizing:'border-box'},
  badge: (color) => ({display:'inline-block',padding:'3px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:600,background:color+'12',color:color,border:`1px solid ${color}30`}),
  modal: {position:'fixed',inset:0,background:'rgba(15,23,42,.35)',backdropFilter:'blur(3px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100,padding:'20px'},
  modalContent: {background:'#FFFFFF',borderRadius:'10px',padding:'24px 28px',maxWidth:'880px',width:'100%',maxHeight:'90vh',overflowY:'auto',border:'1px solid #E2E8F0',boxShadow:'0 8px 30px rgba(0,0,0,0.12)'},
  grid: {display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px'},
  fieldLabel: {fontSize:'10.5px',color:'#64748B',marginBottom:'3px',textTransform:'uppercase',letterSpacing:'.5px',fontWeight:500},
  section: {marginTop:'20px',marginBottom:'10px',fontSize:'11px',fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:'1px',paddingBottom:'6px',borderBottom:'1px solid #E2E8F0'},
};

const Field = ({label,value,onChange,type="text",disabled,options,style={}}) => (
  <div style={{marginBottom:'6px'}}>
    <div style={S.fieldLabel}>{label}</div>
    {options ? (
      <select style={{...S.select,...style}} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input style={{...S.input,...(disabled?{background:'#F8FAFC',color:'#94A3B8',border:'1px solid #E2E8F0'}:{}),...style}} type={type} value={value} onChange={e=>onChange(type==='number'?e.target.value:e.target.value)} disabled={disabled} />
    )}
  </div>
);

const StatusBadge = ({status,onChange}) => (
  <select value={status} onChange={e=>{e.stopPropagation();onChange(e.target.value)}} onClick={e=>e.stopPropagation()}
    style={{...S.badge(STATUS_COLORS[status]||'#666'),cursor:'pointer',outline:'none',appearance:'none',paddingRight:'18px',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2364748B'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 6px center'}}>
    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
  </select>
);

const SummaryTabs = ({contracts}) => {
  const byStatus = {};
  STATUSES.forEach(s => byStatus[s] = contracts.filter(c=>c.status===s).length);
  const active = contracts.filter(c=>["Offer Submitted","Under Contract","Closed"].includes(c.status));
  const avgIrr = active.length > 0 ? active.reduce((a,c)=>a+c.irr,0)/active.length : 0;
  const totalProfit = active.reduce((a,c)=>a+c.netProfit,0);
  const tabs = [
    {label:'Total Contracts',value:contracts.length,sub:STATUSES.map(s=>`${byStatus[s]} ${s}`).join(' · '),color:'#0F172A'},
    {label:'Avg IRR',value:fmtPct(avgIrr),sub:'Active pipeline',color:'#2563EB'},
    {label:'Total Net Profit',value:fmt(totalProfit),sub:'Active pipeline',color:'#059669'},
    {label:'Submitted',value:byStatus["Offer Submitted"],color:'#2563EB'},
    {label:'Under Contract',value:byStatus["Under Contract"],color:'#7C3AED'},
    {label:'Closed',value:byStatus["Closed"],color:'#059669'},
  ];
  return (
    <div style={S.tabs}>
      {tabs.map((t,i)=>(
        <div key={i} style={{...S.tab,borderLeft:`3px solid ${t.color}`,flex:1}}>
          <div style={{...S.tabVal,color:t.color}}>{t.value}</div>
          <div style={S.tabLabel}>{t.label}</div>
          {t.sub && <div style={{fontSize:'9px',color:'#94A3B8',marginTop:'3px'}}>{t.sub}</div>}
        </div>
      ))}
    </div>
  );
};

const CSVModal = ({onClose, onImport}) => {
  const [csv, setCsv] = useState('');
  const handleImport = () => {
    try {
      const lines = csv.trim().split('\n');
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h=>h.trim());
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v=>v.trim());
        const obj = {};
        headers.forEach((h,i)=> obj[h] = vals[i] || '');
        return obj;
      });
      const contracts = rows.map(r => {
        let c = makeContract(r.Resort || r.resort || "Animal Kingdom");
        if (r.Resort || r.resort) c.resort = r.Resort || r.resort;
        if (r.Affiliate || r.affiliate) c.affiliate = r.Affiliate || r.affiliate;
        if (r['Annual Points'] || r.annualPoints) c.annualPoints = Number(r['Annual Points'] || r.annualPoints) || 160;
        if (r['Listing ID'] || r.listingId) c.listingId = r['Listing ID'] || r.listingId;
        if (r['List Price'] || r.listPrice) c.listPrice = Number(r['List Price'] || r.listPrice) || 0;
        if (r['2025 Points'] || r.pts2025) c.pts2025 = Number(r['2025 Points'] || r.pts2025) || 0;
        if (r['2026 Points'] || r.pts2026) c.pts2026 = Number(r['2026 Points'] || r.pts2026) || 0;
        if (r['2027 Points'] || r.pts2027) c.pts2027 = Number(r['2027 Points'] || r.pts2027) || 0;
        if (r['Use Year'] || r.useYear) c.useYear = r['Use Year'] || r.useYear;
        if (r['Deed Expire'] || r.deedExpire) c.deedExpire = Number(r['Deed Expire'] || r.deedExpire) || 2060;
        if (r['Closing Costs'] || r.closingCosts) c.closingCosts = Number(r['Closing Costs'] || r.closingCosts) || 0;
        c.duesPerPt = DUES[c.resort] || 10;
        c.offerPrPt = OFFER_RANGE[c.resort]?.[0] || 100;
        c.resalePrPt = RESALE_RANGE[c.resort]?.[0] || 95;
        return recalc(c);
      });
      onImport(contracts);
    } catch(e) { alert('Error parsing CSV'); }
  };
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={{...S.modalContent,maxWidth:'560px'}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:'15px',fontWeight:700,color:'#0F172A',marginBottom:'12px'}}>Import CSV</div>
        <p style={{fontSize:'12px',color:'#64748B',marginBottom:'12px',lineHeight:'1.5'}}>Paste CSV with headers: Resort, Affiliate, Annual Points, Listing ID, List Price, 2025 Points, 2026 Points, 2027 Points, Use Year, Deed Expire, Closing Costs</p>
        <textarea style={{...S.input,height:'180px',resize:'vertical',fontFamily:'monospace',fontSize:'11.5px'}} value={csv} onChange={e=>setCsv(e.target.value)} placeholder="Resort,Annual Points,List Price,..."/>
        <div style={{display:'flex',gap:'8px',marginTop:'14px',justifyContent:'flex-end'}}>
          <button style={S.btnSec} onClick={onClose}>Cancel</button>
          <button style={S.btn} onClick={handleImport}>Import</button>
        </div>
      </div>
    </div>
  );
};

const ProForma = ({contract, onUpdate, onClose}) => {
  const c = contract;
  const upd = (field, val) => {
    let updated = {...c, [field]: val};
    if (field === 'resort') {
      updated.duesPerPt = DUES[val] || 10;
      updated.offerPrPt = OFFER_RANGE[val]?.[0] || 100;
      updated.resalePrPt = RESALE_RANGE[val]?.[0] || 95;
    }
    onUpdate(recalc(updated));
  };
  const oRange = OFFER_RANGE[c.resort]; const rRange = RESALE_RANGE[c.resort];
  const isUnderContract = c.status === "Under Contract";
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalContent} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px',paddingBottom:'14px',borderBottom:'1px solid #E2E8F0'}}>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <span style={{fontSize:'16px',fontWeight:700,color:'#0F172A'}}>{c.resort}</span>
            <span style={{fontSize:'12px',color:'#64748B'}}>{c.annualPoints} pts</span>
            <StatusBadge status={c.status} onChange={v=>upd('status',v)}/>
          </div>
          <button style={S.btnSec} onClick={onClose}>Close</button>
        </div>

        <div style={S.section}>Contract Details</div>
        <div style={S.grid}>
          <Field label="Resort" value={c.resort} onChange={v=>upd('resort',v)} options={RESORTS}/>
          <Field label="Affiliate" value={c.affiliate} onChange={v=>upd('affiliate',v)} options={AFFILIATES}/>
          <Field label="Status" value={c.status} onChange={v=>upd('status',v)} options={STATUSES}/>
          <Field label="Listing ID" value={c.listingId} onChange={v=>upd('listingId',v)}/>
          <Field label="Listing Link" value={c.listingLink} onChange={v=>upd('listingLink',v)}/>
          <Field label="Use Year" value={c.useYear} onChange={v=>upd('useYear',v)} options={MONTHS}/>
          <Field label="Deed Expire" value={c.deedExpire} onChange={v=>upd('deedExpire',Number(v))} type="number"/>
          <Field label="Years Remaining" value={c.yearsRemaining} disabled/>
          <div/>
        </div>

        <div style={S.section}>Points</div>
        <div style={S.grid}>
          <Field label="Annual Points" value={c.annualPoints} onChange={v=>upd('annualPoints',Number(v))} type="number"/>
          <Field label="2025 Points" value={c.pts2025} onChange={v=>upd('pts2025',Number(v))} type="number"/>
          <Field label="2026 Points" value={c.pts2026} onChange={v=>upd('pts2026',Number(v))} type="number"/>
          <Field label="2027 Points" value={c.pts2027} onChange={v=>upd('pts2027',Number(v))} type="number"/>
          <Field label="Total Points" value={c.totalPoints} disabled/>
          <div/>
        </div>

        <div style={S.section}>Pricing</div>
        <div style={S.grid}>
          <Field label="List Price" value={c.listPrice} onChange={v=>upd('listPrice',Number(v))} type="number"/>
          <Field label="List $/Pt" value={'$'+c.listPrPt.toFixed(2)} disabled/>
          <Field label={`Offer $/Pt (${oRange?oRange[0]+'–'+oRange[1]:''})`} value={c.offerPrPt} onChange={v=>upd('offerPrPt',Number(v))} type="number" style={rangeColor(c.offerPrPt,oRange)}/>
          <Field label="Offer Price" value={'$'+c.offerPrice.toLocaleString()} disabled/>
          <Field label="Negotiation Gap" value={fmt(c.negGap)} disabled/>
          <div/>
        </div>

        <div style={S.section}>Re-Sale & Spread</div>
        <div style={S.grid}>
          <Field label={`Re-Sale $/Pt (${rRange?rRange[0]+'–'+rRange[1]:''})`} value={c.resalePrPt} onChange={v=>upd('resalePrPt',Number(v))} type="number" style={rangeColor(c.resalePrPt,rRange)}/>
          <Field label="Re-Sale ($)" value={fmt(c.resalePrice)} disabled/>
          <Field label="Contract Spread" value={fmt(c.contractSpread)} disabled style={spreadColor(c.contractSpread)}/>
        </div>

        <div style={S.section}>Property Dues</div>
        <div style={S.grid}>
          <Field label="Dues ($/Pt)" value={'$'+c.duesPerPt.toFixed(2)} disabled/>
          <Field label="Dues (Annual)" value={fmt(c.duesAnnual)} disabled/>
          <div/>
        </div>

        <div style={S.section}>Income & Costs</div>
        <div style={S.grid}>
          <Field label="Hold Period (Months)" value={c.holdPeriod} onChange={v=>upd('holdPeriod',Number(v))} type="number"/>
          <Field label="Point Resale Target ($/Pt)" value={c.pointResaleTarget} onChange={v=>upd('pointResaleTarget',Number(v))} type="number"/>
          <Field label="Total Income" value={fmt(c.totalIncome)} disabled/>
          <Field label="Realtor Fee (%)" value={c.realtorFee} onChange={v=>upd('realtorFee',Number(v))} type="number"/>
          <Field label="Realtor Cost" value={fmt(c.realtorCost)} disabled/>
          <Field label="Closing Costs" value={c.closingCosts} onChange={v=>upd('closingCosts',Number(v))} type="number"/>
          <Field label="Total Cost" value={fmt(c.totalCost)} disabled style={{fontWeight:600}}/>
          <div/><div/>
        </div>

        <div style={S.section}>Returns</div>
        <div style={{display:'flex',gap:'16px',padding:'14px 20px',background:'#F8FAFC',borderRadius:'8px',marginTop:'6px',border:'1px solid #E2E8F0'}}>
          <div style={{textAlign:'center',flex:1}}>
            <div style={{fontSize:'24px',fontWeight:800,color:c.netProfit>=0?'#059669':'#DC2626'}}>{fmt(c.netProfit)}</div>
            <div style={S.tabLabel}>Net Profit</div>
          </div>
          <div style={{width:'1px',background:'#E2E8F0'}}/>
          <div style={{textAlign:'center',flex:1}}>
            <div style={{fontSize:'24px',fontWeight:800,color:'#0F172A'}}>{fmtPct(c.roi)}</div>
            <div style={S.tabLabel}>ROI</div>
          </div>
          <div style={{width:'1px',background:'#E2E8F0'}}/>
          <div style={{textAlign:'center',flex:1}}>
            <div style={{fontSize:'24px',fontWeight:800,color:'#2563EB'}}>{fmtPct(c.irr)}</div>
            <div style={S.tabLabel}>IRR (Annualized)</div>
          </div>
        </div>

        {isUnderContract && (
          <>
            <div style={S.section}>Contract Tracking</div>
            <div style={S.grid}>
              <Field label="Earnest Money Amount" value={c.earnestMoney} onChange={v=>upd('earnestMoney',Number(v))} type="number"/>
              <Field label="Date Earnest Money Submitted" value={c.dateEarnestSubmitted} onChange={v=>upd('dateEarnestSubmitted',v)} type="date"/>
              <Field label="ROFR Status" value={c.rofrStatus} onChange={v=>upd('rofrStatus',v)} options={ROFR_STATUSES}/>
              <Field label="ROFR Date" value={c.rofrDate} onChange={v=>upd('rofrDate',v)} type="date"/>
              <Field label="Closing Date" value={c.closingDate} onChange={v=>upd('closingDate',v)} type="date"/>
              <div/>
            </div>
          </>
        )}

        <div style={S.section}>Key Dates</div>
        <div style={S.grid}>
          <Field label="Date Added to Funnel" value={c.dateAdded} onChange={v=>upd('dateAdded',v)} type="date"/>
          <Field label="Date Offer Submitted" value={c.dateOfferSubmitted} onChange={v=>upd('dateOfferSubmitted',v)} type="date"/>
          <Field label="Date Offer Accepted" value={c.dateOfferAccepted} onChange={v=>upd('dateOfferAccepted',v)} type="date"/>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [contracts, setContracts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCSV, setShowCSV] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(1);
  const [filterStatus, setFilterStatus] = useState("All");

  const addContract = () => {
    const c = recalc(makeContract());
    setContracts(prev=>[c,...prev]);
    setSelected(c);
  };

  const updateContract = (updated) => {
    setContracts(prev=>prev.map(c=>c.id===updated.id?updated:c));
    setSelected(updated);
  };

  const updateField = (id, field, val) => {
    setContracts(prev=>prev.map(c=>{
      if(c.id!==id) return c;
      let u = {...c,[field]:val};
      if(field==='resort'){u.duesPerPt=DUES[val]||10;u.offerPrPt=OFFER_RANGE[val]?.[0]||100;u.resalePrPt=RESALE_RANGE[val]?.[0]||95;}
      return recalc(u);
    }));
  };

  const deleteContract = (id) => {
    setContracts(prev=>prev.filter(c=>c.id!==id));
    setSelected(null);
  };

  const importCSV = (newContracts) => {
    setContracts(prev=>[...newContracts,...prev]);
    setShowCSV(false);
  };

  const filtered = filterStatus === "All" ? contracts : contracts.filter(c=>c.status===filterStatus);

  const sorted = useMemo(()=>{
    if(!sortCol) return filtered;
    return [...filtered].sort((a,b)=>{
      let av=a[sortCol],bv=b[sortCol];
      if(typeof av==='number'&&typeof bv==='number') return (av-bv)*sortDir;
      return String(av).localeCompare(String(bv))*sortDir;
    });
  },[filtered,sortCol,sortDir]);

  const handleSort = (col) => {
    if(sortCol===col) setSortDir(d=>d*-1);
    else {setSortCol(col);setSortDir(1);}
  };

  const cols = [
    {key:'irr',label:'IRR',fmt:v=>fmtPct(v),w:'65px'},
    {key:'resort',label:'Resort',w:'115px'},
    {key:'affiliate',label:'Affiliate',w:'72px'},
    {key:'status',label:'Status',w:'130px'},
    {key:'listingId',label:'ID',w:'70px'},
    {key:'annualPoints',label:'Ann. Pts',w:'68px'},
    {key:'totalPoints',label:'Tot. Pts',w:'62px'},
    {key:'listPrice',label:'List Price',fmt:v=>fmt(v),w:'82px'},
    {key:'listPrPt',label:'List $/Pt',fmt:v=>'$'+v.toFixed(0),w:'68px'},
    {key:'offerPrice',label:'Offer',fmt:v=>fmt(v),w:'80px'},
    {key:'offerPrPt',label:'Offer $/Pt',fmt:v=>'$'+v.toFixed(0),w:'72px'},
    {key:'negGap',label:'Gap',fmt:v=>fmt(v),w:'72px'},
    {key:'useYear',label:'UY',w:'40px'},
    {key:'deedExpire',label:'Exp',w:'48px'},
    {key:'dateOfferSubmitted',label:'Offer Date',w:'88px'},
    {key:'dateAdded',label:'Added',w:'88px'},
  ];

  return (
    <div style={S.app}>
      <div style={S.header}>
        <h1 style={S.h1}>DVC Contract Dashboard</h1>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <select style={{...S.select,width:'135px',fontSize:'12px'}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button style={S.btnSec} onClick={()=>setShowCSV(true)}>Import CSV</button>
          <button style={S.btn} onClick={addContract}>+ New Contract</button>
        </div>
      </div>
      <SummaryTabs contracts={contracts}/>
      <div style={{overflowX:'auto',borderRadius:'8px',border:'1px solid #E2E8F0',background:'#FFFFFF'}}>
        <table style={S.table}>
          <thead>
            <tr>{cols.map(col=>(
              <th key={col.key} style={{...S.th,width:col.w,cursor:'pointer',userSelect:'none'}} onClick={()=>handleSort(col.key)}>
                {col.label}{sortCol===col.key?(sortDir===1?' ▲':' ▼'):''}
              </th>
            ))}
            <th style={{...S.th,width:'32px'}}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length===0 && (
              <tr><td colSpan={cols.length+1} style={{padding:'48px',textAlign:'center',color:'#94A3B8',fontSize:'13px'}}>
                No contracts yet. Click <b>+ New Contract</b> or <b>Import CSV</b> to get started.
              </td></tr>
            )}
            {sorted.map(c=>(
              <tr key={c.id} style={hoveredRow===c.id?S.rowHover:S.row} onMouseEnter={()=>setHoveredRow(c.id)} onMouseLeave={()=>setHoveredRow(null)} onClick={()=>setSelected(c)}>
                {cols.map(col=>{
                  if(col.key==='status') return <td key={col.key} style={S.td}><StatusBadge status={c.status} onChange={v=>updateField(c.id,'status',v)}/></td>;
                  if(col.key==='irr') return <td key={col.key} style={{...S.td,fontWeight:700,color:c.irr>=0.3?'#059669':c.irr>=0.15?'#D97706':'#DC2626'}}>{fmtPct(c.irr)}</td>;
                  if(col.key==='offerPrPt') return <td key={col.key} style={{...S.td,...rangeColor(c.offerPrPt,OFFER_RANGE[c.resort])}}>{col.fmt?col.fmt(c[col.key]):c[col.key]}</td>;
                  if(col.key==='listingId') return <td key={col.key} style={S.td}>{c.listingLink?<a href={c.listingLink.startsWith('http')?c.listingLink:'https://'+c.listingLink} target="_blank" rel="noopener" style={{color:'#2563EB',fontWeight:500,textDecoration:'none'}} onClick={e=>e.stopPropagation()}>{c.listingId||'Link'}</a>:c.listingId}</td>;
                  const val = col.fmt ? col.fmt(c[col.key]) : c[col.key];
                  return <td key={col.key} style={S.td}>{val}</td>;
                })}
                <td style={S.td}>
                  <button onClick={e=>{e.stopPropagation();deleteContract(c.id)}} style={{background:'none',border:'none',color:'#CBD5E1',cursor:'pointer',fontSize:'13px',padding:'2px 6px'}} onMouseEnter={e=>e.target.style.color='#DC2626'} onMouseLeave={e=>e.target.style.color='#CBD5E1'}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && <ProForma contract={contracts.find(c=>c.id===selected.id)||selected} onUpdate={updateContract} onClose={()=>setSelected(null)}/>}
      {showCSV && <CSVModal onClose={()=>setShowCSV(false)} onImport={importCSV}/>}
    </div>
  );
}
