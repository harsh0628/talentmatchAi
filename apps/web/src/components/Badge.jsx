function Badge({ text, color }) {
  return (
    // Generic badge with dynamic color class.
    <span className={`badge badge-${color}`}>
      {text}
    </span>
  );
}

export default Badge;