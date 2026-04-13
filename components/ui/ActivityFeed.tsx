'use client';

import type { ApiActivity } from '@/lib/services';

interface ActivityFeedProps {
  activities: ApiActivity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <span className="panel-title">Recent Activity</span>
        <button className="panel-action">View all</button>
      </div>
      {activities.length === 0 && (
        <div className="empty-state">No recent activity.</div>
      )}
      {activities.map((a, i) => (
        <div className="activity-item" key={a.id ?? i}>
          <div className={`activity-icon ${a.cls}`}>{a.icon}</div>
          <div className="activity-body">
            <div
              className="activity-text"
              dangerouslySetInnerHTML={{ __html: a.text }}
            />
            <div className="activity-time">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
