
import { ErrorLog } from '../types';

export const mockErrorLogs: ErrorLog[] = [
    {
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        level: 'Erreur',
        message: 'Failed to connect to SMTP server',
        trace: `at MailService.send (app/services/mail.js:25:15)\n at NotificationManager.notify (app/managers/notification.js:50:9)\n at process.on (app/index.js:12:3)`
    },
    {
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        level: 'Avertissement',
        message: 'Commission calculation for op_type "op_reabo_canal" took over 500ms',
        trace: `at CommissionService.calculate (app/services/commission.js:120:5)\n at TransactionValidator.validate (app/validators/transaction.js:85:12)`
    },
    {
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        level: 'Erreur',
        message: 'Database query timeout on "transactions" table',
        trace: `at SupabaseClient.<anonymous> (node_modules/@supabase/postgrest-js:45:1)\n at process.run (app/utils/db.js:33:7)`
    },
     {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        level: 'Info',
        message: 'System configuration reloaded by dev_david',
        trace: `at ConfigService.reload (app/services/config.js:15:3)\n at /api/config/reload (app/routes/admin.js:45:1)`
    }
];
