# Changelog v8

## Notification Center
- Sheet NOTIFICATIONS.
- In-app notifications.
- Unread badge.
- Mark one/all as read.
- Notification pages for all roles.

## Transactional Email
- Registration confirmation.
- Invoice notification.
- Payment proof confirmation.
- Payment approved/rejected.
- Student account activation.
- Daily subscription expiry reminders.

## Automation
- `setupNalarva()` ensures one daily time-driven trigger.
- Reminder runs at approximately 07:00 Asia/Jakarta.

## Reporting
- Revenue summary.
- Pending invoice summary.
- Active subscriptions.
- Registration volume.
- CSV export for orders, registrations, and exam results.

## Safety / fallback
- Mail quota checked before send.
- In-app notifications remain available even when email quota is exhausted.
