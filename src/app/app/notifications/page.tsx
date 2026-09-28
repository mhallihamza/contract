import { markNotificationsReadAction } from "@/app/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { getServerI18n } from "@/lib/i18n/server";
import { listNotifications, unreadNotificationCount } from "@/lib/notifications/service";

/**
 * Notification inbox (§44).
 *
 * In-app notifications are recorded by the domain services; this page only reads
 * them (scoped to the signed-in user) and marks them read.
 */
export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const { locale, d } = await getServerI18n();

  const [notifications, unread] = await Promise.all([
    listNotifications(user.id),
    unreadNotificationCount(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{d.client.notificationsTitle}</h1>
          {unread > 0 ? <Badge variant="info">{unread}</Badge> : null}
        </div>
        {unread > 0 ? (
          <form action={markNotificationsReadAction}>
            <Button type="submit" variant="outline" size="sm">
              {d.client.notificationsMarkAllRead}
            </Button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            {d.client.notificationsEmpty}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Card className={notification.readAt ? undefined : "border-primary/40"}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium" dir="auto">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="auto">
                      {notification.body}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {formatDateTime(notification.createdAt, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.readAt ? null : (
                      <Badge variant="info" className="text-[10px]">
                        {d.client.notificationsUnread}
                      </Badge>
                    )}
                    {notification.href ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={notification.href}>{d.common.view}</a>
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
