export default function CollegeBrand({ contextText = 'College Event Management' }) {
  return (
    <div className="brand-block" aria-label="college-brand">
      <p className="brand-college">Saradha Gangadharan College</p>
      <p className="brand-department">Department of Computer Science</p>
      <p className="brand-context">{contextText}</p>
    </div>
  )
}
