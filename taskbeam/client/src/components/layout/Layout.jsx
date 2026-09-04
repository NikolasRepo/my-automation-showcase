import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Layout.module.css'

export default function Layout({ children, activeProject, onLogout }) {
  const { user } = useAuth()

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
            {activeProject.client_name && (
              <span className={styles.activeProjectClient}>{activeProject.client_name}</span>
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
              <NavLink to="/floorplan" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                Floor plan
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
              <NavLink to="/files" className={({ isActive }) => isActive ? `${styles.navItem} ${styles.active}` : styles.navItem}>
                Files
              </NavLink>
              <NavLink to="/client" className={styles.navItem}>
                Client view ↗
              </NavLink>
            </>
          )}
        </nav>

        <div className={styles.userSection}>
          <span className={styles.userEmail}>{user?.email}</span>
          <span className={styles.userRole}>{user?.role}</span>
          <button className={styles.logoutBtn} onClick={onLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <div className={styles.main}>
        {children}
      </div>
    </div>
  )
}