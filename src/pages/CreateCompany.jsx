import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Upload, X, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const INDUSTRIES = [
  'Technology', 'Media & Entertainment', 'Music', 'Film & TV', 'Creator Economy',
  'Fashion & Beauty', 'Sports', 'Healthcare', 'Education', 'Finance',
  'Food & Beverage', 'Gaming', 'Travel', 'Retail', 'Marketing & Advertising',
  'Non-profit', 'Other',
]

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']

const COMPANY_TYPES = [
  'Public', 'Private', 'Non-profit', 'Self-employed',
  'Educational Institution', 'Government', 'Partnership',
]

export default function CreateCompany() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 1
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [industry, setIndustry] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState('')

  // Step 2
  const [companySize, setCompanySize] = useState('')
  const [companyType, setCompanyType] = useState('')
  const [foundedYear, setFoundedYear] = useState('')
  const [headquarters, setHeadquarters] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')

  // Step 3
  const [specialties, setSpecialties] = useState([])
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [twitter, setTwitter] = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube] = useState('')

  function handleImageSelect(file, setFile, setPreview) {
    if (!file) return
    setFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(file)
  }

  async function uploadImage(file, folder) {
    if (!file) return null
    const ext = file.name.split('.').pop()
    const path = `${folder}/${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(path, file, { contentType: file.type })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('uploads').getPublicUrl(path)
    return data.publicUrl
  }

  function handleSpecialtyKey(e) {
    if ((e.key === 'Enter' || e.key === ',') && specialtyInput.trim()) {
      e.preventDefault()
      const val = specialtyInput.trim().replace(/,$/, '')
      if (val && specialties.length < 10 && !specialties.includes(val)) {
        setSpecialties([...specialties, val])
      }
      setSpecialtyInput('')
    }
  }

  function removeSpecialty(tag) {
    setSpecialties(specialties.filter(s => s !== tag))
  }

  function validateStep1() {
    if (!name.trim()) return 'Company name is required.'
    if (!industry) return 'Please select an industry.'
    return ''
  }

  function validateStep2() {
    if (!companySize) return 'Please select a company size.'
    if (!companyType) return 'Please select a company type.'
    return ''
  }

  function handleNext() {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : ''
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const logoUrl = await uploadImage(logoFile, 'company-logos')
      const bannerUrl = await uploadImage(bannerFile, 'company-banners')

      const { data: company, error: insertError } = await supabase
        .from('companies')
        .insert({
          name,
          tagline,
          industry,
          company_size: companySize,
          company_type: companyType,
          founded_year: foundedYear ? Number(foundedYear) : null,
          headquarters,
          website,
          description,
          specialties,
          social_links: { linkedin, twitter, instagram, youtube },
          logo_url: logoUrl,
          banner_url: bannerUrl,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single()

      if (insertError) throw insertError

      await supabase.from('company_admins').insert({
        company_id: company.id,
        user_id: user.id,
        role: 'owner',
      })

      navigate(`/company/${company.id}`)
    } catch (err) {
      setError(err.message || 'Failed to create company page.')
    } finally {
      setLoading(false)
    }
  }

  const steps = ['Identity', 'Details', 'Extras']

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Company Page</h1>
            <p className="text-sm text-muted-foreground">Set up your company's presence on Philomni</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {steps.map((label, i) => {
            const num = i + 1
            const active = step === num
            const done = step > num
            return (
              <div key={num} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {done ? <Check className="w-4 h-4" /> : num}
                </div>
                <span className={`text-sm ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
                {i < steps.length - 1 && <div className="w-8 h-px bg-border ml-1" />}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Company Identity</h2>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Company Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Acme Studios"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Company Logo</label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-border" />
                      <button onClick={() => { setLogoFile(null); setLogoPreview('') }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer flex items-center gap-2 bg-muted hover:bg-muted/80 border border-border rounded-xl px-4 py-2 text-sm text-foreground transition-colors">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => handleImageSelect(e.target.files[0], setLogoFile, setLogoPreview)} />
                  </label>
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Banner Image</label>
                {bannerPreview ? (
                  <div className="relative">
                    <img src={bannerPreview} alt="banner" className="w-full h-[200px] rounded-xl object-cover border border-border" />
                    <button onClick={() => { setBannerFile(null); setBannerPreview('') }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80">
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer w-full h-[200px] rounded-xl bg-muted border border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload banner image</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => handleImageSelect(e.target.files[0], setBannerFile, setBannerPreview)} />
                  </label>
                )}
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tagline</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tagline}
                    onChange={e => setTagline(e.target.value.slice(0, 120))}
                    placeholder="A short one-liner about your company"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{tagline.length}/120</span>
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Industry <span className="text-red-400">*</span></label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Company Details</h2>

              {/* Size & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company Size <span className="text-red-400">*</span></label>
                  <select
                    value={companySize}
                    onChange={e => setCompanySize(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select size</option>
                    {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company Type <span className="text-red-400">*</span></label>
                  <select
                    value={companyType}
                    onChange={e => setCompanyType(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select type</option>
                    {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Founded Year & HQ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Founded Year</label>
                  <input
                    type="number"
                    value={foundedYear}
                    onChange={e => setFoundedYear(e.target.value)}
                    min={1800}
                    max={2030}
                    placeholder="e.g. 2018"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Headquarters</label>
                  <input
                    type="text"
                    value={headquarters}
                    onChange={e => setHeadquarters(e.target.value)}
                    placeholder="City, Country"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Website URL</label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Company Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Tell people about your company, its mission, and what makes it unique... (50+ characters recommended)"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <p className={`text-xs mt-1 ${description.length < 50 && description.length > 0 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                  {description.length} chars{description.length < 50 ? ' — aim for 50+' : ''}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-foreground">Extras & Social</h2>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Specialties <span className="text-muted-foreground text-xs font-normal">(max 10)</span>
                </label>
                <div className="bg-muted border border-border rounded-xl px-3 py-2 flex flex-wrap gap-2 min-h-[46px]">
                  {specialties.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                      {tag}
                      <button onClick={() => removeSpecialty(tag)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {specialties.length < 10 && (
                    <input
                      type="text"
                      value={specialtyInput}
                      onChange={e => setSpecialtyInput(e.target.value)}
                      onKeyDown={handleSpecialtyKey}
                      placeholder={specialties.length === 0 ? 'Type and press Enter or comma...' : ''}
                      className="bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none flex-1 min-w-[140px]"
                    />
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Social Links</h3>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">LinkedIn URL</label>
                  <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Twitter/X Handle</label>
                    <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)}
                      placeholder="@yourhandle"
                      className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Instagram Handle</label>
                    <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)}
                      placeholder="@yourhandle"
                      className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">YouTube URL</label>
                  <input type="url" value={youtube} onChange={e => setYoutube(e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
              </div>

              {/* Preview card */}
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Preview</h3>
                <div className="bg-background border border-border rounded-2xl overflow-hidden max-w-xs">
                  <div className="h-16 bg-gradient-to-br from-primary/20 to-purple-900/30" />
                  <div className="-mt-6 ml-4 mb-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="logo" className="w-12 h-12 rounded-xl object-cover border-2 border-background" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-card border-2 border-background flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="px-4 pb-4">
                    <p className="font-bold text-foreground text-sm">{name || 'Company Name'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{tagline || 'Your tagline here'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {industry && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{industry}</span>}
                      {companySize && <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{companySize}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Company Page
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
