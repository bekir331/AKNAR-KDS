import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';


interface NavItem {
  to: string;
  icon: string;
  label: string;
  badge?: number;
  staffOnly?: boolean;
  adminOnly?: boolean;
}

interface SidebarProps {
  alertCount?: number;
}

export default function Sidebar({ alertCount = 0 }: SidebarProps) {
  const { user, logout, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: NavItem[] = [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/orchards', icon: '🌿', label: 'Bahçelerim' },
    { to: '/compare', icon: '⚖️', label: 'Bahçe Karşılaştırma' },
    { to: '/predict', icon: '🔬', label: 'Yaprak Tahmini' },
    { to: '/guide', icon: '📖', label: 'Hastalık Rehberi' },
    { to: '/sensor-kds', icon: '🧠', label: 'Yapay Zeka KDS' },
    { to: '/history', icon: '📸', label: 'Geçmiş Analizler' },
    { to: '/reports', icon: '📈', label: 'Sensör Raporları' },
    { to: '/alerts', icon: '🔔', label: 'Uyarılar', badge: alertCount > 0 ? alertCount : undefined },
    { to: '/irrigation', icon: '💧', label: 'Sulama Kayıtları' },
    { to: '/devices', icon: '📡', label: 'Cihaz Yönetimi' },
    { to: '/profile', icon: '👤', label: 'Profilim' },
  ];

  const staffItems: NavItem[] = [
    { to: '/producers', icon: '👥', label: 'Üreticiler', staffOnly: true },
    { to: '/users', icon: '⚙️', label: 'Kullanıcılar', adminOnly: true },
  ];

  const roleLabel = user?.role === 'Admin' ? 'Yönetici' : user?.role === 'Consultant' ? 'Danışman' : 'Üretici';
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'AK';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🍊</div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">AKNAR-KDS</span>
          <span className="sidebar-logo-subtitle">Karar Destek Sistemi</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Menü</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="sidebar-item-badge">{item.badge > 99 ? '99+' : item.badge}</span>
            )}
          </NavLink>
        ))}

        {isStaff && (
          <>
            <div className="sidebar-section-label">Yönetim</div>
            {staffItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={handleLogout} title="Çıkış Yap">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.email}</div>
            <div className="sidebar-user-role">{roleLabel} · Çıkış</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>↩</span>
        </div>
      </div>
    </aside>
  );
}
