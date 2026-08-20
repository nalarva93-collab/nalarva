# Update Backend ke Nalarva Complete v11

1. Replace seluruh `google-apps-script/Code.gs` pada project `NALARVA BACKEND`.
2. Save.
3. Jalankan `setupNalarva()` sekali.
4. Setup v11 akan:
   - menambah sheet `BACKUPS`;
   - membuat folder `Backup Database`;
   - mengganti trigger reminder lama dengan maintenance harian;
   - membuat trigger backup mingguan;
   - mempertahankan data lama.
5. Deploy > Manage deployments > Edit > New version > Deploy.
6. URL `/exec` tetap sama.
7. Health check harus menunjukkan `9.0-production-ready`.

## Audit & Backup
Buka:
`/dashboard/admin/audit`

## Trigger
- `runNalarvaMaintenanceDaily`
- `createDatabaseBackupWeekly`
