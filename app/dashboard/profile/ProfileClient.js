'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  User, Mail, Phone, Building2, Globe, Award,
  Bell, Camera, CheckCircle, AlertCircle, Save,
  TrendingUp, MessageSquare, Percent, ChevronDown
} from 'lucide-react'

const FREQ_OPTIONS = [
  { value: 'monthly',     label: 'Monthly' },
  { value: 'bimonthly',   label: 'Every 2 Months' },
  { value: 'quarterly',   label: 'Quarterly' },
  { value: 'biannually',  label: 'Twice a Year' },
  { value: 'annually',    label: 'Annually' },
]

const ROLE_LABEL = { homeowner: 'Homeowner', agent: 'Real Estate Agent', lender: 'Lender' }
const ROLE_COLOR = {
  homeowner: 'bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30',
  agent:     'bg-green-900/20 text-green-400 border-green-500/30',
  lender:    'bg-blue-900/20 text-blue-400 border-blue-500/30',
}

export default function ProfileClient({ profile, userId }) {
  const [form, setForm] = useState({
    full_name:                     profile?.full_name || '',
    email:                         profile?.email || '',
    phone:                         profile?.phone || '',
    company:                       profile?.company || '',
    website:                       profile?.website || '',
    license_number:                profile?.license_number || '',
    bio:                           profile?.bio || '',
    notification_value_frequency:  profile?.notification_value_frequency || 'monthly',
    notification_messages:         profile?.notification_messages ?? true,
    notification_rate_alerts:      profile?.notification_rate_alerts ?? true,
  })
  const [avatarUrl, setAvatarUrl]   = useState(profile?.avatar_url || null)
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)
  const [error, setError]           = useState(null)
  const fileRef = useRef()

  const update = (f) => (e) => setForm(p => ({
    ...p,
    [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }))

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const supabase = createClient()
      const ext  = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl + '?t=' + Date.now())
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId)
    } catch (err) {
      setError('Failed to upload photo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('profiles').update({
        full_name:                    form.full_name,
        phone:                        form.phone,
        company:                      form.company,
        website:                      form.website,
        license_number:               form.license_number,
        bio:                          form.bio,
        notification_value_frequency: form.notification_value_frequency,
        notification_messages:        form.notification_messages,
        notification_rate_alerts:     form.notification_rate_alerts,
      }).eq('id', userId)
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inp = "w-full pl-10 pr-4 py-3 bg-[#0f1623] border border-[#344a57]/40 rounded-xl text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm"
  const lbl = "block text-xs font-medium text-[#8fa1ad] mb-2 uppercase tracking-wider"

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-20">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-[#8fa1ad] text-sm mt-0.5">Manage your account settings</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${ROLE_COLOR[profile?.role]}`}>
          {ROLE_LABEL[profile?.role]}
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/30 text-green-400 rounded-xl p-4 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />Profile saved successfully!
        </div>
      )}

      {/* Avatar */}
      <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-4 text-sm">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[#344a57]" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#344a57] flex items-center justify-center text-white text-2xl font-bold border-2 border-[#344a57]">
                {form.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#c9a84c] rounded-full flex items-center justify-center shadow-lg hover:bg-[#d4b560] transition-colors">
              <Camera className="w-3.5 h-3.5 text-[#0f1623]" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-white text-sm font-medium">{form.full_name || 'Your Name'}</p>
            <p className="text-[#8fa1ad] text-xs mt-0.5">{profile?.email}</p>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="mt-2 text-xs text-[#c9a84c] hover:underline disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Change photo'}
            </button>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-semibold text-sm">Personal Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
              <input value={form.full_name} onChange={update('full_name')} placeholder="Jane Smith" className={inp} />
            </div>
          </div>
          <div>
            <label className={lbl}>Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
              <input value={form.phone} onChange={update('phone')} placeholder="(858) 555-0123" className={inp} />
            </div>
          </div>
        </div>

        <div>
          <label className={lbl}>Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
            <input value={form.email} disabled placeholder={profile?.email}
              className={`${inp} opacity-50 cursor-not-allowed`} />
          </div>
          <p className="text-[#464d4f] text-xs mt-1">Email cannot be changed here</p>
        </div>

        {(profile?.role === 'agent' || profile?.role === 'lender') && (
          <>
            <div>
              <label className={lbl}>Company</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                <input value={form.company} onChange={update('company')} placeholder="Keller Williams Realty" className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                  <input value={form.website} onChange={update('website')} placeholder="www.carmelvalley.com" className={inp} />
                </div>
              </div>
              <div>
                <label className={lbl}>License # (DRE)</label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad]" />
                  <input value={form.license_number} onChange={update('license_number')} placeholder="01988197" className={inp} />
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <label className={lbl}>Bio</label>
          <textarea value={form.bio} onChange={update('bio')} rows={3}
            placeholder="Tell homeowners about yourself..."
            className="w-full px-4 py-3 bg-[#0f1623] border border-[#344a57]/40 rounded-xl text-white placeholder-[#464d4f] focus:outline-none focus:border-[#c9a84c] transition-colors text-sm resize-none" />
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-[#1a2332] border border-[#344a57]/30 rounded-2xl p-6 space-y-5">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#c9a84c]" /> Notification Preferences
        </h2>

        {/* Home Value Frequency */}
        {profile?.role === 'homeowner' && (
          <div>
            <label className={lbl}>Home Value Updates</label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad] pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8fa1ad] pointer-events-none" />
              <select value={form.notification_value_frequency} onChange={update('notification_value_frequency')}
                className={`${inp} appearance-none cursor-pointer`}>
                {FREQ_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <p className="text-[#464d4f] text-xs mt-1">How often you receive home value update notifications</p>
          </div>
        )}

        {/* Toggle switches */}
        <div className="space-y-3">
          {[
            { key: 'notification_messages',    icon: MessageSquare, label: 'Message Notifications',  desc: 'Get notified when you receive a new message' },
            { key: 'notification_rate_alerts', icon: Percent,       label: 'Rate Alert Notifications', desc: 'Get notified about mortgage rate changes' },
          ].map(({ key, icon: Icon, label, desc }) => (
            <label key={key} className="flex items-center justify-between p-4 bg-[#0f1623] rounded-xl cursor-pointer hover:bg-[#0f1623]/60 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#8fa1ad]" />
                <div>
                  <div className="text-white text-sm font-medium">{label}</div>
                  <div className="text-[#464d4f] text-xs">{desc}</div>
                </div>
              </div>
              <div className="relative flex-shrink-0 ml-4">
                <input type="checkbox" checked={form[key]} onChange={update(key)} className="sr-only peer" />
                <div className="w-10 h-6 bg-[#344a57]/40 peer-checked:bg-[#c9a84c] rounded-full transition-colors" />
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-4 bg-[#c9a84c] hover:bg-[#d4b560] text-[#0f1623] rounded-2xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  )
}
