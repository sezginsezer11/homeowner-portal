'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { FileText, Upload, Download, ExternalLink, ChevronRight, Table, Presentation, ArrowLeft } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function ListingPresentationPage() {
  const [comps, setComps] = useState([])
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handleExcelUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
        setComps(data)
        setUploading(false)
      } catch (err) {
        console.error('Excel parse error:', err)
        setUploading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  const EXPECTED_COLS = ['Address','List Price','Sale Price','Beds','Baths','Sq Ft','$/Sq Ft','DOM','Status','Year Built','Notes']

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#65676b] mb-2">
              <Link href="/dashboard/agent" className="hover:text-[#1877F2]">Dashboard</Link>
              <ChevronRight className="w-3 h-3"/>
              <span className="text-[#1a1a2e] font-medium">Listing Presentation</span>
            </div>
            <h1 className="text-2xl font-black text-[#1a1a2e]">Listing Presentation Builder</h1>
            <p className="text-[#65676b] text-sm mt-1">Upload your comparables, then open the interactive presentation.</p>
          </div>
          <div className="flex gap-3">
            <a href="/listing-presentation.html" target="_blank"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a2e] hover:bg-[#344a57] text-white font-bold text-sm rounded-xl transition-colors">
              <ExternalLink className="w-4 h-4"/> Open Presentation
            </a>
            <a href="/listing-presentation.html" download="ListingPresentation-SezSezer.html"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a84c] hover:bg-[#b8973b] text-[#1a1a2e] font-bold text-sm rounded-xl transition-colors">
              <Download className="w-4 h-4"/> Download
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Instructions + Upload */}
          <div className="lg:col-span-1 space-y-5">

            {/* Upload Card */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Table className="w-5 h-5 text-[#1877F2]"/>
                <h2 className="font-bold text-[#1a1a2e]">Upload Comparables</h2>
              </div>
              <p className="text-[#65676b] text-xs mb-4 leading-relaxed">
                Upload an Excel file with your CMA comps. They'll display in the Comparable Sales section of the presentation.
              </p>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-[#e4e6eb] hover:border-[#1877F2] rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-[#f0f7ff]">
                <Upload className="w-8 h-8 text-[#9ca3af] mx-auto mb-2"/>
                <div className="text-sm font-semibold text-[#1a1a2e]">
                  {fileName || 'Click to upload Excel file'}
                </div>
                <div className="text-xs text-[#9ca3af] mt-1">.xlsx or .xls</div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload}/>

              {comps.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                  <span className="font-bold">✓</span> {comps.length} comparables loaded
                </div>
              )}
            </div>

            {/* Excel Format Guide */}
            <div className="bg-white rounded-2xl border border-[#e4e6eb] p-5 shadow-sm">
              <h3 className="font-bold text-[#1a1a2e] text-sm mb-3">Expected Column Format</h3>
              <div className="space-y-1.5">
                {EXPECTED_COLS.map((col, i) => (
                  <div key={col} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded bg-[#1a1a2e] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">{String.fromCharCode(65+i)}</span>
                    <span className="text-[#444]">{col}</span>
                  </div>
                ))}
              </div>
              <a href="#" onClick={(e) => { e.preventDefault(); downloadTemplate() }}
                className="mt-4 flex items-center gap-1.5 text-xs text-[#1877F2] hover:underline font-semibold">
                <Download className="w-3 h-3"/> Download blank template
              </a>
            </div>

            {/* How to use */}
            <div className="bg-[#f8f9fa] rounded-2xl border border-[#e4e6eb] p-5">
              <h3 className="font-bold text-[#1a1a2e] text-sm mb-3">How to Use</h3>
              <ol className="space-y-2 text-xs text-[#65676b]">
                {[
                  'Upload your Excel comps file above',
                  'Click "Open Presentation" to launch',
                  'Enter the subject property address to auto-populate details',
                  'Edit any fields manually',
                  'Click "Apply to Presentation" to populate all slides',
                  'Print or Save as PDF when ready',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">{i+1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: Comps table + Preview */}
          <div className="lg:col-span-2 space-y-5">

            {/* Comps table */}
            {comps.length > 0 ? (
              <div className="bg-white rounded-2xl border border-[#e4e6eb] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#e4e6eb]">
                  <h2 className="font-bold text-[#1a1a2e]">Comparable Sales — {comps.length} properties</h2>
                  <button onClick={() => { setComps([]); setFileName('') }}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold">Clear</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#f8f9fa]">
                        {Object.keys(comps[0]).map(k => (
                          <th key={k} className="text-left px-3 py-2 text-[#65676b] font-bold uppercase tracking-wider text-[10px] whitespace-nowrap border-b border-[#e4e6eb]">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comps.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 text-[#444] whitespace-nowrap border-b border-[#f0f2f5]">{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Presentation preview tiles */
              <div className="bg-white rounded-2xl border border-[#e4e6eb] p-6 shadow-sm">
                <h2 className="font-bold text-[#1a1a2e] mb-1">Presentation Pages</h2>
                <p className="text-[#65676b] text-xs mb-5">13-slide luxury listing presentation</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { num:'01', title:'Cover', icon:'🏡' },
                    { num:'02', title:'Property Details', icon:'📋' },
                    { num:'03', title:'Property Overview', icon:'🏠' },
                    { num:'04', title:'About Sez Sezer', icon:'👤' },
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
                    <div key={slide.num} className="bg-[#f8f9fa] rounded-xl p-3 border border-[#e4e6eb] text-center hover:border-[#1877F2] hover:bg-[#f0f7ff] transition-all cursor-pointer">
                      <div className="text-2xl mb-1">{slide.icon}</div>
                      <div className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wider">Page {slide.num}</div>
                      <div className="text-xs font-semibold text-[#1a1a2e] mt-0.5">{slide.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Launch button */}
            <a href="/listing-presentation.html" target="_blank"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-[#1a1a2e] to-[#344a57] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity text-sm shadow-lg">
              <Presentation className="w-5 h-5"/>
              Open Full Presentation
              <ExternalLink className="w-4 h-4 opacity-60"/>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function downloadTemplate() {
  const cols = ['Address','List Price','Sale Price','Beds','Baths','Sq Ft','$/Sq Ft','DOM','Status','Year Built','Notes']
  const sample = [
    ['13278 Caminito Mendiola, San Diego, CA 92130','$3,495,000','$3,350,000','3','2.5','3,841','$872','14','Sold','2003','Pool, Views'],
    ['7687 Marker Rd, San Diego, CA 92130','$1,750,000','$1,740,000','4','2.5','2,156','$807','7','Sold','2003','3-car garage'],
  ]
  const ws = XLSX.utils.aoa_to_sheet([cols, ...sample])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Comps')
  XLSX.writeFile(wb, 'CMA-Comps-Template.xlsx')
}
