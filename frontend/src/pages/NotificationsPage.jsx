import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../lib/api';
import { useApp }  from '../context/AppContext';
import { Spinner, EmptyState } from '../components/common/index.jsx';

const TYPE_MAP = {
  admin_approval: { icon: 'bi-person-check',   color: 'var(--blue)',  bg: 'rgba(59,110,255,0.12)'  },
  info:           { icon: 'bi-info-circle',     color: 'var(--teal)', bg: 'rgba(20,184,166,0.12)'  },
  success:        { icon: 'bi-check-circle',    color: 'var(--green)', bg: 'rgba(34,197,94,0.12)'  },
  warning:        { icon: 'bi-exclamation-triangle', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
  danger:         { icon: 'bi-x-circle',        color: 'var(--rose)',  bg: 'rgba(244,63,94,0.12)'  },
};

export default function NotificationsPage() {
  const { setNotifCount } = useApp();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.list().then(r => r.data),
  });

  const readAllMut = useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onSuccess:  () => { qc.invalidateQueries(['notifications']); setNotifCount(0); },
  });

  // Mark all read on mount
  useEffect(() => {
    readAllMut.mutate();
  }, []);

  const notifs  = data?.data || [];
  const unread  = notifs.filter(n => !n.read).length;

  return (
    <div className="page-enter" style={{ maxWidth: 720 }}>
      <div className="section-header">
        <div className="section-title">Notifications</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {unread > 0 && <span className="badge badge-blue">{unread} unread</span>}
          {notifs.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => readAllMut.mutate()}>
              <i className="bi bi-check2-all" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {isLoading ? <Spinner centered /> : notifs.length === 0 ? (
        <EmptyState icon="bi-bell-slash" title="All caught up!" sub="No notifications at the moment" />
      ) : (
        notifs.map(n => {
          const t = TYPE_MAP[n.type] || TYPE_MAP.info;
          return (
            <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
              <div className="notif-icon-wrap" style={{ background: t.bg }}>
                <i className={`bi ${t.icon}`} style={{ color: t.color }} />
              </div>
              <div className="notif-body">
                <div className="notif-msg">{n.message}</div>
                <div className="notif-time">
                  <i className="bi bi-clock" />
                  {new Date(n.created_at).toLocaleString('en-IN')}
                </div>
              </div>
              {!n.read && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0, marginTop: 6 }} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
