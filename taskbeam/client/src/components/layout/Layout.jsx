import { NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Layout({ children, activeProject }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandName}>TaskBeam</span>
          <span className={styles.brandSub}>Project manager</span>
        </div>

        {activeProject && (
          <div className={styles.activeProject}>
            <span className={styles.activeProjectLabel}>Active project</span>
            <span className={styles.activeProjectName}>{activeProject.name}</span>
            {activeProject.clientName && (
              <span className={styles.activeProjectClient}>{activeProject.clientName}</span>
            )}
          </div>
        )}

        <nav className={styles.nav}>
          <span className={styles.navLabel}>Workspace</span>
          <NavLink to="/" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
            Projects
          </NavLink>

          {activeProject && (
            <>
              <span className={styles.navLabel} style={{ marginTop: '12px' }}>Current project</span>
              <NavLink to="/rooms" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                Rooms & layout
              </NavLink>
              <NavLink to="/materials" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                Materials
              </NavLink>
              <NavLink to="/estimates" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                Cost estimate
              </NavLink>
              <NavLink to="/tasks" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                Tasks
              </NavLink>
              <NavLink to="/client" className={styles.navItem}>
                Client view ↗
              </NavLink>
            </>
          )}
        </nav>
      </aside>
      <div className={styles.main}>
        {children}
      </div>
    </div>
  )
}