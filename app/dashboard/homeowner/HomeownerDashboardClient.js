'use client'
import { useState, useEffect } from 'react'
import { Home, TrendingUp, DollarSign, MessageSquare, Plus, RefreshCw, ChevronRight, User, AlertCircle, Building2, Percent, ArrowUpRight, ArrowDownRight, Clock, Trash2, ShoppingCart, BarChart2, X, Edit2, Search, UserCheck } from 'lucide-react'
import AddPropertyModal from './AddPropertyModal'
import EditPropertyModal from './EditPropertyModal'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

function fmt(n) { if(!n&&n!==0)return'—'; return'$'+Math.round(n).toLocaleString('en-US') }
function pct(n) { if(!n)return'—'; return(n*100).toFixed(1)+'%' }
function daysAgo(d) { if(!d)return null; const days=Math.floor((Date.now()-new Date(d).getTime())/(86400000)); return days===0?'Today':days===1?'Yesterday':`${days} days ago` }
function daysUntil(d) { if(!d)return null; const days=Math.ceil((new Date(d).getTime()-Date.now())/(86400000)); return days<=0?'Now':days===1?'Tomorrow':`In ${days} days` }

function EquityMeter({equity,value}) {
  if(!value||!equity)return null
  const ratio=Math.min(Math.max(equity/value,0),1),degrees=ratio*180,r=70,cx=90,cy=90
  const toRad=d=>(d-180)*Math.PI/180,x=cx+r*Math.cos(toRad(degrees)),y=cy+r*Math.sin(toRad(degrees))
  const color=ratio>0.5?'#22c55e':ratio>0.25?'#f59e0b':'#ef4444'
  return <svg viewBox="0 0 180 100" className="w-full max-w-[180px] mx-auto mt-2"><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#f0f2f5" strokeWidth="16" strokeLinecap="round"/><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="#e4e6eb" strokeWidth="14" strokeLinecap="round"/><path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${x} ${y}`} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"/><circle cx={x} cy={y} r="6" fill="white" stroke={color} strokeWidth="2"/><text x={cx} y={cy-8} textAnchor="middle" fill="#1a1a2e" fontSize="14" fontWeight="bold">{pct(ratio)}</text><text x={cx} y={cy+8} textAnchor="middle" fill="#65676b" fontSize="7">EQUITY RATIO</text></svg>
}

export default function HomeownerDashboardClient({profile,properties,unreadMessages,relationships}) {
  const [selectedProp,setSelectedProp]     = useState(properties[0]||null)
  const [avmCache,setAvmCache]             = useState({})
  const [avmLoading,setAvmLoading]         = useState({})
  const [avmError,setAvmError]             = useState(null)
  const [showAddModal,setShowAddModal]     = useState(false)
  const [showEditModal,setShowEditModal]   = useState(false)
  const [editingProp,setEditingProp]       = useState(null)
  const [rate,setRate]                     = useState(null)
  const [valueHistory,setValueHistory]     = useState([])

  const agent  = relationships.find(r=>r.professional?.role==='agent')?.professional
  const lender = relationships.find(r=>r.professional?.role==='lender')?.professional

  useEffect(()=>{fetch('/api/rates').then(r=>r.json()).then(d=>setRate(d.rate)).catch(()=>{})},[])
  useEffect(()=>{properties.forEach(p=>fetchAVM(p,false))},[properties.length])
  useEffect(()=>{
    if(!selectedProp)return
    const avm=avmCache[selectedProp.id]
    if(avm&&selectedProp.purchase_price){
      const purchase=selectedProp.purchase_price||avm.estimatedValue*0.85
      setValueHistory(Array.from({length:6},(_,i)=>({month:['Jan','Feb','Mar','Apr','May','Jun'][i],value:Math.round(purchase+((avm.estimatedValue-purchase)*(i/5)))})))
    }
  },[selectedProp?.id,avmCache])

  const fetchAVM = async(prop,force=false)=>{
    if(avmLoading[prop.id])return
    setAvmLoading(p=>({...p,[prop.id]:true})); setAvmError(null)
    try{
      const q=new URLSearchParams({address:prop.address,city:prop.city,state:prop.state,zip:prop.zip,property_id:prop.id,force:force?'true':'false'})
      const res=await fetch(`/api/avm?${q}`)
      const data=await res.json()
      if(data.error)throw new Error(data.error)
      setAvmCache(p=>({...p,[prop.id]:data}))
    }catch(err){if(prop.id===selectedProp?.id)setAvmError(err.message)}
    finally{setAvmLoading(p=>({...p,[prop.id]:false}))}
  }

  const openEdit=(prop,e)=>{e.stopPropagation();setEditingProp(prop);setShowEditModal(true)}

  const avm=selectedProp?avmCache[selectedProp.id]:null
  const loading=selectedProp?avmLoading[selectedProp.id]:false
  const equity=avm?.estimatedValue&&selectedProp?.loan_balance?avm.estimatedValue-selectedProp.loan_balance:null
  const gainLoss=avm?.estimatedValue&&selectedProp?.purchase_price?avm.estimatedValue-selectedProp.purchase_price:null
  const gainPct=gainLoss&&selectedProp?.purchase_price?(gainLoss/selectedProp.purchase_price)*100:null

  // Portfolio totals
  const totalEquity=properties.reduce((s,p)=>{const v=avmCache[p.id]?.estimatedValue||p.avm_value||0;return s+(v&&p.loan_balance?v-p.loan_balance:0)},0)
  const totalValue=properties.reduce((s,p)=>s+(avmCache[p.id]?.estimatedValue||p.avm_value||0),0)

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl lg:text-2xl font-bold text-[#1a1a2e]">Welcome back, {profile?.full_name?.split(' ')[0]||'there'} 👋</h1><p className="text-[#65676b] text-sm mt-0.5">Your home intelligence dashboard</p></div>
        <button onClick={()=>setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4"/><span className="hidden xs:inline">Add Property</span><span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* Portfolio summary (inline, not modal) */}
      {properties.length>1&&totalValue>0&&(
        <div className="bg-gradient-to-r from-[#1877F2] to-[#1665d8] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white/70 text-xs uppercase tracking-wider font-semibold">Portfolio Overview</div>
            <div className="text-white/60 text-xs">{properties.length} properties</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {label:'Total Value', value:fmt(totalValue)},
              {label:'Total Equity',value:fmt(totalEquity)},
              {label:'Avg Equity %',value:totalValue?`${((totalEquity/totalValue)*100).toFixed(0)}%`:'—'},
              {label:'Properties',  value:properties.length},
            ].map(item=>(
              <div key={item.label} className="bg-white/15 rounded-xl p-3 text-center">
                <div className="text-white/60 text-[9px] uppercase tracking-wider mb-1">{item.label}</div>
                <div className="text-white font-bold text-lg">{item.value}</div>
              </div>
            ))}
          </div>
          {/* Clickable property rows */}
          <div className="mt-3 space-y-1.5">
            {properties.map(p=>{
              const v=avmCache[p.id]?.estimatedValue||p.avm_value||0
              const eq=v&&p.loan_balance?v-p.loan_balance:null
              return(
                <button key={p.id} onClick={()=>setSelectedProp(p)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left ${selectedProp?.id===p.id?'bg-white/25 border border-white/40':'bg-white/10 hover:bg-white/20'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Home className="w-3.5 h-3.5 text-white/70 flex-shrink-0"/>
                    <span className="text-white text-xs font-semibold truncate">{p.address}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                    <span className="text-white/70 text-xs">{fmt(v)}</span>
                    {eq&&<span className="text-green-300 text-xs font-bold">{fmt(eq)} equity</span>}
                    <button onClick={e=>openEdit(p,e)} className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/20">
                      <Edit2 className="w-3 h-3"/>
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* No properties */}
      {properties.length===0&&(
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#e4e6eb] p-12 text-center shadow-card">
          <div className="w-14 h-14 bg-[#e7f0fd] rounded-2xl flex items-center justify-center mx-auto mb-4"><Home className="w-7 h-7 text-[#1877F2]"/></div>
          <h3 className="text-[#1a1a2e] font-bold text-lg mb-1">Add your first property</h3>
          <p className="text-[#65676b] text-sm mb-5">Start tracking your home value, equity, and more</p>
          <button onClick={()=>setShowAddModal(true)} className="px-6 py-3 bg-[#1877F2] hover:bg-[#1665d8] text-white rounded-xl font-semibold text-sm transition-colors shadow-sm">Add Property</button>
        </div>
      )}

      {/* Single property selector */}
      {properties.length===1&&(
        <div className="flex items-center gap-2">
          <button onClick={()=>setSelectedProp(properties[0])} className="flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1877F2] border-[#1877F2] text-white border">
            {properties[0].address}
          </button>
          <button onClick={e=>openEdit(properties[0],e)} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#e4e6eb] text-[#65676b] hover:text-[#1877F2] hover:border-[#1877F2] rounded-xl text-xs font-semibold transition-all">
            <Edit2 className="w-3 h-3"/> Edit Details
          </button>
        </div>
      )}

      {selectedProp&&(
        <>
          {/* Address bar */}
          <div className="bg-white rounded-xl border border-[#e4e6eb] shadow-card px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Home className="w-3.5 h-3.5 text-[#1877F2] flex-shrink-0"/>
              <span className="text-[#1a1a2e] font-medium text-xs truncate">{selectedProp.address}, {selectedProp.city}, {selectedProp.state} {selectedProp.zip}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {avm?.lastUpdated&&<div className="hidden sm:flex items-center gap-1 text-[#9ca3af] text-[10px]"><Clock className="w-3 h-3"/><span>Updated {daysAgo(avm.lastUpdated)} · Next {daysUntil(avm.nextUpdate)}</span></div>}
              <button onClick={e=>openEdit(selectedProp,e)} className="flex items-center gap-1 text-[#65676b] hover:text-[#1877F2] transition-colors text-xs font-semibold">
                <Edit2 className="w-3.5 h-3.5"/> <span className="hidden sm:inline">Edit</span>
              </button>
              <button onClick={()=>fetchAVM(selectedProp,true)} disabled={loading} className="flex items-center gap-1 text-[#1877F2] hover:text-[#1665d8] transition-colors text-xs font-semibold">
                <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`}/><span className="hidden sm:inline">{loading?'Updating...':'Refresh'}</span>
              </button>
            </div>
          </div>

          {avm?.cached&&(
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-[#65676b]">
              <Clock className="w-3.5 h-3.5 text-[#1877F2] flex-shrink-0"/>
              Cached value from {daysAgo(avm.lastUpdated)}. Next refresh {daysUntil(avm.nextUpdate)}.
              <button onClick={()=>fetchAVM(selectedProp,true)} className="text-[#1877F2] hover:underline ml-auto font-semibold">Refresh now</button>
            </div>
          )}
          {avmError&&<div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0"/>{avmError}</div>}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Value */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Est. Value</span><div className="w-7 h-7 rounded-xl bg-[#e7f0fd] flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-[#1877F2]"/></div></div>
              <div className="text-xl lg:text-2xl font-bold text-[#1a1a2e]">{loading?<span className="text-[#9ca3af] text-base animate-pulse">Loading...</span>:fmt(avm?.estimatedValue)}</div>
              {avm&&<div className="text-[10px] text-[#65676b] mt-1">{fmt(avm.lowValue)} — {fmt(avm.highValue)}</div>}
              {selectedProp.purchase_price&&<div className="text-[10px] text-[#9ca3af] mt-0.5">Purchased: {fmt(selectedProp.purchase_price)}</div>}
            </div>
            {/* Equity */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Equity</span><div className="w-7 h-7 rounded-xl bg-green-50 flex items-center justify-center"><DollarSign className="w-3.5 h-3.5 text-green-600"/></div></div>
              <div className="text-xl lg:text-2xl font-bold text-green-600">{loading?'—':fmt(equity)}</div>
              {selectedProp.loan_balance&&<div className="text-[10px] text-[#65676b] mt-1">Loan: {fmt(selectedProp.loan_balance)}</div>}
              <EquityMeter equity={equity} value={avm?.estimatedValue}/>
              {equity&&avm?.estimatedValue&&<Link href="/dashboard/homeowner/heloc" className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-[#e7f0fd] hover:bg-[#1877F2] text-[#1877F2] hover:text-white rounded-lg text-[10px] font-bold transition-all"><ShoppingCart className="w-3 h-3"/>Shop HELOC</Link>}
            </div>
            {/* Gain */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">Total Gain</span><div className={`w-7 h-7 rounded-xl flex items-center justify-center ${gainLoss>=0?'bg-green-50':'bg-red-50'}`}>{gainLoss>=0?<ArrowUpRight className="w-3.5 h-3.5 text-green-600"/>:<ArrowDownRight className="w-3.5 h-3.5 text-red-500"/>}</div></div>
              <div className={`text-xl lg:text-2xl font-bold ${gainLoss>=0?'text-green-600':'text-red-500'}`}>{loading?'—':gainLoss?fmt(Math.abs(gainLoss)):'—'}</div>
              {gainPct!=null&&<div className={`text-xs font-semibold mt-1 ${gainPct>=0?'text-green-600':'text-red-500'}`}>{gainPct>=0?'+':''}{gainPct.toFixed(1)}%</div>}
            </div>
            {/* Rate */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-[10px] font-semibold text-[#65676b] uppercase tracking-wider">30yr Rate</span><div className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center"><Percent className="w-3.5 h-3.5 text-purple-600"/></div></div>
              <div className="text-xl lg:text-2xl font-bold text-purple-600">{rate?`${rate}%`:'—'}</div>
              <div className="text-[10px] text-[#65676b] mt-1">Freddie Mac avg</div>
              {selectedProp.loan_rate&&<div className="mt-2 bg-[#f8f9fa] rounded-lg px-2 py-1.5 text-[10px]"><span className="text-[#65676b]">Your rate: </span><span className="text-[#1a1a2e] font-bold">{selectedProp.loan_rate}%</span>{rate&&selectedProp.loan_rate>rate&&<span className="text-[#1877F2] font-bold ml-1">↓ Refi?</span>}</div>}
              <Link href="/dashboard/homeowner/rates" className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white rounded-lg text-[10px] font-bold transition-all"><ShoppingCart className="w-3 h-3"/>Shop Rates</Link>
            </div>
          </div>

          {/* Chart + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="text-[#1a1a2e] font-bold mb-4 text-sm">Value Trend</h3>
              {valueHistory.length>0?(
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={valueHistory}>
                    <defs><linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1877F2" stopOpacity={0.15}/><stop offset="95%" stopColor="#1877F2" stopOpacity={0}/></linearGradient></defs>
                    <XAxis dataKey="month" tick={{fill:'#65676b',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#65676b',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>'$'+(v/1000).toFixed(0)+'k'}/>
                    <Tooltip contentStyle={{background:'white',border:'1px solid #e4e6eb',borderRadius:'12px',fontSize:'12px'}} formatter={v=>[fmt(v),'Est. Value']}/>
                    <Area type="monotone" dataKey="value" stroke="#1877F2" strokeWidth={2.5} fill="url(#valGrad)" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              ):(
                <div className="h-[180px] flex items-center justify-center text-[#9ca3af] text-sm">{loading?'Loading chart...':'Add your purchase price to see trend'}</div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#1a1a2e] font-bold text-sm">Property Details</h3>
                <button onClick={e=>openEdit(selectedProp,e)} className="text-[#1877F2] hover:underline text-xs font-semibold flex items-center gap-1"><Edit2 className="w-3 h-3"/>Edit</button>
              </div>
              <div className="space-y-2">
                {[['Type',selectedProp.loan_type||'—'],['Bedrooms',selectedProp.bedrooms||'—'],['Bathrooms',selectedProp.bathrooms||'—'],['Sq Ft',selectedProp.sqft?selectedProp.sqft.toLocaleString():'—'],['Year Built',selectedProp.year_built||'—'],['Loan Rate',selectedProp.loan_rate?`${selectedProp.loan_rate}%`:'—']].map(([k,v])=>(
                  <div key={k} className="flex items-center justify-between py-1.5 border-b border-[#f0f2f5] last:border-0">
                    <span className="text-[#65676b] text-xs">{k}</span><span className="text-[#1a1a2e] text-xs font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Messages + My Team */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#1877F2]"/>Messages{unreadMessages.length>0&&<span className="bg-[#1877F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadMessages.length}</span>}</h3>
                <Link href="/dashboard/homeowner/messages" className="text-[#1877F2] hover:underline text-xs font-semibold flex items-center gap-1">All<ChevronRight className="w-3 h-3"/></Link>
              </div>
              {unreadMessages.length===0?(
                <div className="text-center py-5"><MessageSquare className="w-8 h-8 text-[#e4e6eb] mx-auto mb-2"/><p className="text-[#9ca3af] text-xs">No new messages</p></div>
              ):(
                <div className="space-y-2">{unreadMessages.map(msg=>(
                  <div key={msg.id} className="flex items-start gap-3 p-3 bg-[#f8f9fa] rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[#e7f0fd] flex items-center justify-center flex-shrink-0 text-[#1877F2] text-xs font-bold">{msg.from?.full_name?.charAt(0)||'?'}</div>
                    <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-[#1a1a2e] text-xs font-semibold">{msg.from?.full_name}</span><span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${msg.message_type==='rate_alert'?'bg-purple-100 text-purple-600':msg.message_type==='value_update'?'bg-[#e7f0fd] text-[#1877F2]':'bg-[#f0f2f5] text-[#65676b]'}`}>{msg.message_type==='rate_alert'?'Rate':msg.message_type==='value_update'?'Value':'Msg'}</span></div><p className="text-[#65676b] text-xs mt-0.5 truncate">{msg.subject||msg.body}</p></div>
                  </div>
                ))}</div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-card p-5">
              <h3 className="text-[#1a1a2e] font-bold text-sm flex items-center gap-2 mb-3"><User className="w-4 h-4 text-[#1877F2]"/>My Team</h3>
              <div className="space-y-3">
                {/* Agent */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${agent?'bg-green-50 border-green-200':'bg-[#f8f9fa] border-[#e4e6eb]'}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#e4e6eb] flex items-center justify-center text-[#1a1a2e] font-bold text-sm">
                      {agent?.full_name?.charAt(0)||<Building2 className="w-4 h-4 text-[#9ca3af]"/>}
                    </div>
                    {agent&&<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${agent?'text-green-600':'text-[#9ca3af]'}`}>Agent</div>
                    {agent?<><div className="text-[#1a1a2e] text-sm font-semibold">{agent.full_name}</div>{agent.company&&<div className="text-[#65676b] text-xs">{agent.company}</div>}</>:
                      <Link href="/dashboard/homeowner/connections" className="flex items-center gap-1.5 mt-1 text-xs text-[#1877F2] font-semibold hover:underline"><Search className="w-3 h-3"/>Find an Agent</Link>}
                  </div>
                </div>
                {/* Lender */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${lender?'bg-blue-50 border-blue-200':'bg-[#f8f9fa] border-[#e4e6eb]'}`}>
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#e4e6eb] flex items-center justify-center text-[#1a1a2e] font-bold text-sm">
                      {lender?.full_name?.charAt(0)||<Building2 className="w-4 h-4 text-[#9ca3af]"/>}
                    </div>
                    {lender&&<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-blue-500"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${lender?'text-blue-600':'text-[#9ca3af]'}`}>Lender</div>
                    {lender?<><div className="text-[#1a1a2e] text-sm font-semibold">{lender.full_name}</div>{lender.company&&<div className="text-[#65676b] text-xs">{lender.company}</div>}</>:
                      <Link href="/dashboard/homeowner/connections" className="flex items-center gap-1.5 mt-1 text-xs text-[#1877F2] font-semibold hover:underline"><Search className="w-3 h-3"/>Find a Lender</Link>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showAddModal&&<AddPropertyModal onClose={()=>setShowAddModal(false)} onAdded={()=>{setShowAddModal(false);window.location.reload()}}/>}
      {showEditModal&&editingProp&&<EditPropertyModal property={{...editingProp,avm_value:avmCache[editingProp.id]?.estimatedValue||editingProp.avm_value}} onClose={()=>setShowEditModal(false)} onSaved={()=>{setShowEditModal(false);window.location.reload()}} onDeleted={()=>{setShowEditModal(false);window.location.reload()}}/>}
    </div>
  )
}
