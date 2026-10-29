/** The Scalezix header, identical to Tasks 1 and 2 except for the task badge. */
export default function Header() {
  return (
    <header className="top">
      <div className="wrap top-in">
        <a className="brand-link" href="#top" aria-label="Scalezix Ventures LLP, Full Stack Developer Intern Assessment">
          <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="currentColor" />
            <path d="M11.2 21V13.2a1.8 1.8 0 0 1 1.8-1.8h1.8a1.8 1.8 0 0 1 1.8 1.8V21M16.8 14.2h2.8a1.6 1.6 0 0 1 1.6 1.6V21M14.1 21v-1.1M9.5 21.2h12.9" fill="none" stroke="#fff" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="brand-text">
            <span className="brand">Scalezix Ventures LLP</span>
            <span className="brand-sub">Full Stack Developer Intern Assessment</span>
          </span>
        </a>
        <span className="task-badge" role="img" aria-label="Task 3 of 5">
          <span className="task-dots" aria-hidden="true"><i /><i /><i className="on" /><i /><i /></span>
          TASK 03 / 05
        </span>
      </div>
    </header>
  );
}