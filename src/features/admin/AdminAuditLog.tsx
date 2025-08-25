




import React, { useState, useMemo, useEffect } from 'react';
import { PageComponentProps, AuditLog, User } from '../../types';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { formatDate } from '../../utils/formatters';
import { formatShortId } from '../../utils/idFormatters';
import { Pagination } from '../../components/common/Pagination';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

export const AdminAuditLog: React.FC<PageComponentProps> = ({ refreshKey }) => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            const { data: auditData, error: auditError } = await supabase
                .from('audit_logs')
                .select('id, user_id, action, entity_type, entity_id, timestamp, details, user_role, ip_address')
                .order('timestamp', { ascending: false });

            if (auditError) {
                handleSupabaseError(auditError, "Chargement des journaux d'audit");
                setLogs([]);
            } else if (auditData) {
                const logsData = auditData as any[];
                const userIds = [...new Set(logsData.map(log => log.user_id).filter(Boolean))] as string[];
                const { data: usersData, error: usersError } = await supabase.from('profiles').select('id, name').in('id', userIds);
                if (usersError) {
                    handleSupabaseError(usersError, "Chargement des profils pour les journaux d'audit");
                }
                const userMap = ((usersData as any[]) ?? []).reduce((acc: Record<string, string>, u) => {
                    acc[u.id] = u.name;
                    return acc;
                }, {});

                const formattedLogs = logsData.map(log => ({
                    timestamp: log.timestamp,
                    user: log.user_id ? userMap[log.user_id] || formatShortId(log.user_id, 'profile') : "Système",
                    role: log.user_role || "N/A",
                    action: log.action,
                    entity: log.entity_id || log.entity_type || "Système",
                    details: log.details ? JSON.stringify(log.details) : '',
                    ip: log.ip_address || 'N/A',
                }));
                setLogs(formattedLogs);
            }
            setLoading(false);
        };
        fetchLogs();
    }, [refreshKey]);


    const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE);
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return logs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [logs, currentPage]);

    const headers = ['Timestamp', 'Utilisateur', 'Rôle', 'Action', 'Entité', 'Détails', 'IP'];
    const rows = paginatedLogs.map(log => [
        formatDate(log.timestamp),
        log.user,
        log.role,
        log.action,
        log.entity,
        log.details,
        log.ip
    ]);

    if (loading) return <Card title="Journal d'Audit des Actions Système" icon="fa-clipboard-list">Chargement...</Card>;

    return (
        <Card title="Journal d'Audit des Actions Système" icon="fa-clipboard-list">
             <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-md bg-gray-50">
                <div><label className="form-label form-label-sm">Date</label><input type="date" className="form-input form-input-sm"/></div>
                <div><label className="form-label form-label-sm">Utilisateur</label><input type="text" className="form-input form-input-sm"/></div>
                <div><label className="form-label form-label-sm">Type d'Action</label><select className="form-select form-select-sm"><option>Toutes</option></select></div>
            </form>
            <Table headers={headers} rows={rows} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </Card>
    );
};