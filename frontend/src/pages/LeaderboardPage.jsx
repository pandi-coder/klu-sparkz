import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from '../lib/api';
import { Spinner, EmptyState } from '../components/common/index.jsx';

const getInitials = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const RANK_STYLE = {
  1: { bg: 'linear-gradient(135deg,#ffd700,#f59e0b)', color: '#1a0f00', icon: '🥇' },
  2: { bg: 'linear-gradient(135deg,#c0c0c0,#9ca3af)', color: '#111',     icon: '🥈' },
  3: { bg: 'linear-gradient(135deg,#cd7f32,#b45309)', color: '#fff',      icon: '🥉' },
};

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn:  () => leaderboardApi.list().then(r => r.data),
  });

  const entries = data?.data || [];

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);

  return (
    <div className="page-enter">
      <div className="section-header">
        <div className="section-title">🏆 Leaderboard</div>
        <span className="badge badge-gold">{entries.length} participants</span>
      </div>

      {isLoading ? <Spinner centered /> : entries.length === 0 ? (
        <EmptyState icon="bi-trophy" title="No rankings yet" sub="Results will appear here after events conclude" />
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length >= 3 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 20, marginBottom: 36, padding: '20px 0' }}>
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                const style = RANK_STYLE[rank];
                const height = rank === 1 ? 160 : rank === 2 ? 130 : 110;
                return (
                  <div key={entry.id} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>{style.icon}</div>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: 'linear-gradient(135deg,#dc2a3a,var(--gold))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'white', fontSize: '1.1rem', marginBottom: 8,
                    }}>
                      {getInitials(entry.users?.name)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 2 }}>{entry.users?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 12 }}>{entry.users?.department}</div>
                    <div style={{
                      width: 90, height: height,
                      background: style.bg,
                      borderRadius: '10px 10px 0 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', color: style.color,
                    }}>
                      <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{entry.points}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, opacity: 0.8 }}>pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className="card">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Participant</th>
                  <th>Department</th>
                  <th>Event</th>
                  <th>Prize</th>
                  <th style={{ textAlign: 'right' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const rankStyle = RANK_STYLE[idx + 1];
                  return (
                    <tr key={entry.id}>
                      <td>
                        <div
                          className="rank-badge"
                          style={rankStyle
                            ? { background: rankStyle.bg, color: rankStyle.color, fontSize: '0.9rem' }
                            : { background: 'var(--bg3)', color: 'var(--muted)', fontSize: '0.85rem' }}
                        >
                          {rankStyle ? rankStyle.icon : idx + 1}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="lb-avatar">{getInitials(entry.users?.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{entry.users?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Year {entry.users?.year}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{entry.users?.department || '—'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{entry.events?.title || '—'}</td>
                      <td>
                        {entry.prize_won
                          ? <span className="badge badge-gold">{entry.prize_won}</span>
                          : <span style={{ color: 'var(--muted2)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1rem' }}>
                          {entry.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
