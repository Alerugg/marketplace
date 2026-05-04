export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">DRI</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}
