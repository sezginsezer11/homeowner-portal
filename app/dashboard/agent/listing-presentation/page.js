'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { FileText, Upload, Download, ExternalLink, ChevronRight, Table, Star, TrendingUp, Home } from 'lucide-react'
import Papa from 'papaparse'

function fmt(v) {
  if (!v) return '—'
  return String(v).trim() || '—'
}

function fmtPrice(v) {
  if (!v) return '—'
  const s = String(v).replace(/[^0-9.]/g, '')
  if (!s) return String(v)
  return '$' + parseFloat(s).toLocaleString('en-US')
}

export default function ListingPresentationPage() {
  const [rows, setRows]         = useState([])
  const [subject, setSubject]   = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError]       = useState('')
  const fileRef = useRef()

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setError('')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data
        // First row is Subject Property
        const subj = data.find(r => r['MLS #'] === 'Subject Property' || r['Status'] === '' || r['MLS #'] === '')
        const comps = data.filter(r => r['MLS #'] !== 'Subject Property' && r['MLS #'])
        setSubject(subj || null)
        setRows(comps)
      },
      error: (err) => setError('Could not parse file: ' + err.message)
    })
  }

  const avgPrice = rows.length
    ? Math.round(rows.reduce((s, r) => {
        const v = parseFloat(String(r['Close Price'] || '').replace(/[^0-9.]/g, '')) || 0
        return s + v
      }, 0) / rows.filter(r => r['Close Price']).length)
    : 0

  const avgPricePerSqft = rows.length
    ? (rows.reduce((s, r) => {
        const v = parseFloat(String(r['Sold Price Per SQFT'] || '').replace(/[^0-9.]/g, '')) || 0
        return s + v
      }, 0) / rows.filter(r => r['Sold Price Per SQFT']).length).toFixed(0)
    : 0

  const avgDom = rows.length
    ? Math.round(rows.reduce((s, r) => s + (parseInt(r['Days on Market']) || 0), 0) / rows.length)
    : 0

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#65676b] mb-2">
              <Link href="/dashboard/agent" className="hover:text-[#1877F2]">Dashboard</Link>
              <ChevronRight className="w-3 h-3"/>
              <span className="text-[#1a1a2e] font-medium">Listing Presentation</span>
            </div>
            <h1 className="text-2xl font-black text-[#1a1a2e]">Listing Presentation Builder</h1>
            <p className="text-[#65676b] text-sm mt-1">Upload your MLS comps CSV, then open the interactive presentation.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <a href="/listing-presentation.html" target="_blank"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a2e] hover:bg-[#344a57] text-white font-bold text-sm rounded-xl transition-colors">
              <ExternalLink className="w-4 h-4"/> Open Presentation
            </a>
            <a href="/listing-presentation.html" download="ListingPresentation-SezSezer.html"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a84c] hover:bg-[#b8973b] text-[#1a1a2e] font-bold text-sm rounded-xl transition-colors">
              <Download className="w-4 h-4"/> Download PDF
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* Upload */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Table className="w-4 h-4 text-[#1877F2]"/>
                <h2 className="font-bold text-[#1a1a2e] text-sm">Upload Comps</h2>
              </div>
              <p className="text-[#65676b] text-xs mb-3 leading-relaxed">
                Upload your MLS export CSV (same format as your Paragon/Flexmls export).
              </p>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#e4e6eb] hover:border-[#1877F2] rounded-xl p-5 text-center cursor-pointer transition-all hover:bg-[#f0f7ff]">
                <Upload className="w-7 h-7 text-[#9ca3af] mx-auto mb-2"/>
                <div className="text-sm font-semibold text-[#1a1a2e] truncate px-2">
                  {fileName || 'Click to upload'}
                </div>
                <div className="text-xs text-[#9ca3af] mt-0.5">.csv or .xlsx</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload}/>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              {rows.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                  <span className="font-bold">✓</span> {rows.length} comps loaded
                </div>
              )}
            </div>

            {/* Expected format */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-5 shadow-sm">
              <h3 className="font-bold text-[#1a1a2e] text-xs uppercase tracking-wider mb-3">Expected Columns</h3>
              <div className="space-y-1">
                {['MLS #','Status','Address','My Notes','Beds Total','Baths Total','LivingArea','Lot Size Sqft','Year Built','Close Date','Close Price','Sold Price Per SQFT','OrigListPr','Current Price','Listed Price Per SQFT','Days on Market'].map(col => (
                  <div key={col} className="text-xs text-[#65676b] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] flex-shrink-0"/>
                    {col}
                  </div>
                ))}
              </div>
              <p className="text-[#9ca3af] text-[10px] mt-3 italic">First row labeled "Subject Property" is treated as the listing address.</p>
            </div>

            {/* How to use */}
            <div className="bg-[#f8f9fa] rounded-2xl border border-[#e4e6eb] p-4">
              <h3 className="font-bold text-[#1a1a2e] text-xs uppercase tracking-wider mb-3">How to Use</h3>
              <ol className="space-y-2">
                {[
                  'Export comps from MLS as CSV',
                  'Upload the file here',
                  'Review the summary stats',
                  'Open Presentation',
                  'Enter subject property address',
                  'Print / Save as PDF',
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#65676b]">
                    <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{i+1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-5">

            {/* Subject Property */}
            {subject && (
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#344a57] rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-[#c9a84c]"/>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#c9a84c]">Subject Property</span>
                </div>
                <div className="text-xl font-black mb-3">{fmt(subject['Address'])}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ['List Price', fmtPrice(subject['Current Price'] || subject['OrigListPr'])],
                    ['Beds / Baths', `${fmt(subject['Beds Total'])} / ${fmt(subject['Baths Total'])}`],
                    ['Living Area', fmt(subject['LivingArea']) + ' sqft'],
                    ['Year Built', fmt(subject['Year Built'])],
                  ].map(([l, v]) => (
                    <div key={l} className="bg-white/10 rounded-xl p-3">
                      <div className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">{l}</div>
                      <div className="font-bold text-sm text-white">{v}</div>
                    </div>
                  ))}
                </div>
                {subject['My Notes'] && (
                  <div className="mt-3 text-xs text-white/70 bg-white/10 rounded-xl p-3 italic">
                    "{subject['My Notes']}"
                  </div>
                )}
              </div>
            )}

            {/* Stats summary */}
            {rows.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Avg Sale Price', value: '$' + avgPrice.toLocaleString('en-US'), icon: TrendingUp, color: 'text-green-600' },
                  { label: 'Avg $/Sq Ft', value: '$' + avgPricePerSqft, icon: Home, color: 'text-[#1877F2]' },
                  { label: 'Avg Days on Market', value: avgDom + ' days', icon: ChevronRight, color: 'text-[#c9a84c]' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-2xl border border-[#e4e6eb] p-4 shadow-sm text-center">
                    <div className="text-xs text-[#65676b] uppercase tracking-wider mb-1">{label}</div>
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                    <div className="text-xs text-[#9ca3af] mt-0.5">{rows.length} comps</div>
                  </div>
                ))}
              </div>
            )}

            {/* Comps table */}
            {rows.length > 0 ? (
              <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e6eb]">
                  <h2 className="font-bold text-[#1a1a2e]">Comparable Sales <span className="text-[#9ca3af] font-normal text-sm ml-1">({rows.length})</span></h2>
                  <button onClick={() => { setRows([]); setSubject(null); setFileName('') }}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    Clear
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-[#e4e6eb]">
                        {['Address','Beds','Baths','Sq Ft','Close Price','$/Sq Ft','DOM','Close Date','Status','Notes'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 text-[#65676b] font-bold uppercase tracking-wider text-[10px] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className={`border-b border-[#f0f2f5] hover:bg-[#f8f9fa] transition-colors ${i % 2 === 0 ? '' : 'bg-[#fafafa]'}`}>
                          <td className="px-3 py-2.5 font-semibold text-[#1a1a2e] whitespace-nowrap">{fmt(row['Address'])}</td>
                          <td className="px-3 py-2.5 text-center">{fmt(row['Beds Total'])}</td>
                          <td className="px-3 py-2.5 text-center">{fmt(row['Baths Total'])}</td>
                          <td className="px-3 py-2.5 text-right">{fmt(row['LivingArea'])}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-green-700">{fmt(row['Close Price'])}</td>
                          <td className="px-3 py-2.5 text-right text-[#1877F2]">{fmt(row['Sold Price Per SQFT'])}</td>
                          <td className="px-3 py-2.5 text-center">{fmt(row['Days on Market'])}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-[#65676b]">{fmt(row['Close Date'])}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row['Status'] === 'Closed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                              {fmt(row['Status'])}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[#65676b] max-w-xs">
                            <div className="truncate" title={row['My Notes']}>{fmt(row['My Notes'])}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Empty state - show presentation preview */
              <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6 shadow-sm">
                <h2 className="font-bold text-[#1a1a2e] mb-1">Presentation Slides</h2>
                <p className="text-[#65676b] text-xs mb-5">13-slide luxury listing presentation — upload comps to populate CMA data</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {[
                    { num:'01', title:'Cover', icon:'🏡' },
                    { num:'02', title:'Property Details', icon:'📋' },
                    { num:'03', title:'Property Overview', icon:'🏠' },
                    { num:'04', title:'About Sez', icon:'👤' },
                    { num:'05', title:'Market Truth', icon:'📊' },
                    { num:'06', title:'The Risk', icon:'⚠️' },
                    { num:'07', title:'Framework', icon:'🎯' },
                    { num:'08', title:'Launch Timeline', icon:'📅' },
                    { num:'09', title:'Demand Curve', icon:'📈' },
                    { num:'10', title:'Property Website', icon:'💻' },
                    { num:'11', title:'Digital Marketing', icon:'📱' },
                    { num:'12', title:'Home Checklist', icon:'✅' },
                    { num:'13', title:'Offers & Next Steps', icon:'✍️' },
                  ].map(slide => (
                    <div key={slide.num} className="bg-[#f8f9fa] rounded-xl p-3 border border-[#e4e6eb] text-center hover:border-[#1877F2] hover:bg-[#f0f7ff] transition-all">
                      <div className="text-xl mb-1">{slide.icon}</div>
                      <div className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider">Pg {slide.num}</div>
                      <div className="text-[11px] font-semibold text-[#1a1a2e] mt-0.5 leading-tight">{slide.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Launch button */}
            <a href="/listing-presentation.html" target="_blank"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-[#1a1a2e] to-[#344a57] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity text-sm shadow-lg">
              <FileText className="w-5 h-5"/>
              Open Full Presentation
              <ExternalLink className="w-4 h-4 opacity-60"/>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
