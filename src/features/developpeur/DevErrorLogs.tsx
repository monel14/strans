import React, { useState, useMemo } from 'react';
import { PageComponentProps, ErrorLog } from '../../types';
import { Card } from '../../components/common/Card';
import { mockErrorLogs as initialLogs } from '../../data';
import { formatDate, timeAgo } from '../../utils/formatters';
import { getBadgeClass } from '../../utils/uiHelpers';
import { Pagination } from '../../components/common/Pagination';

type LogWithStatus = ErrorLog & { resolved?: boolean };

const StatCard: React.FC<{ title: string; value: string | number; icon: string, color: string }> = ({ title, value, icon, color }) => (
    <div className={`p-4 rounded-lg shadow-md flex items-center ${color}`}>
        <div className="p-3 rounded-full bg-white bg-opacity-20 mr-4">
            <i className={`fas ${icon} fa-lg text-white`}></i>
        </div>
        <div>
            <p className="text-white text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

export const DevErrorLogs: React.FC<PageComponentProps> = () => {
    // NOTE: This component uses mock data. In a real application, these logs would be ingested
    // from a logging service (like Sentry, Logtail) or a dedicated database table.
    const [logs, setLogs] = useState<LogWithStatus[]>(initialLogs.map(log => ({ ...log, resolved: false })));
    const [expandedLogTimestamp, setExpandedLogTimestamp] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const handleToggleDetails = (timestamp: string) => {
        setExpandedLogTimestamp(current => (current === timestamp ? null : timestamp));
    };

    const handleResolveLog = (timestamp: string) => {
        setLogs(currentLogs => currentLogs.map(log =>
            log.timestamp === timestamp ? { ...log, resolved: true } : log
        ));
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesLevel = levelFilter === 'all' || log.level.toLowerCase() === levelFilter;
            const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter);
            return matchesLevel && matchesDate;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logs, levelFilter, dateFilter]);
    
    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = useMemo(() => {
        return filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setExpandedLogTimestamp(null);
    };

    const stats = useMemo(() => {
        const errors = logs.filter(l => l.level === 'Erreur' && !l.resolved).length;
        const warnings = logs.filter(l => l.level === 'Avertissement' && !l.resolved).length;
        const last24h = logs.filter(l => new Date(l.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
        return { errors, warnings, last24h };
    }, [logs]);

    const getLevelIndicatorClass = (level: ErrorLog['level']) => {
        switch (level) {
            case 'Erreur': return 'border-red-500';
            case 'Avertissement': return 'border-yellow-500';
            case 'Info': return 'border-blue-500';
            default: return 'border-gray-500';
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatCard title="Erreurs Actives" value={stats.errors} icon="fa-bug" color="bg-red-500" />
                <StatCard title="Avertissements Actifs" value={stats.warnings} icon="fa-exclamation-triangle" color="bg-yellow-500" />
                <StatCard title="Incidents (24h)" value={stats.last24h} icon="fa-clock" color="bg-blue-500" />
            </div>

            <Card title="Journaux d'Erreurs Système" icon="fa-clipboard-list">
                <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-md bg-gray-50">
                    <div>
                        <label className="form-label form-label-sm">Filtrer par Date</label>
                        <input type="date" className="form-input form-input-sm" value={dateFilter} onChange={e => { setDateFilter(e.target.value); handlePageChange(1); }} />
                    </div>
                    <div>
                        <label className="form-label form-label-sm">Filtrer par Niveau</label>
                        <select className="form-select form-select-sm" value={levelFilter} onChange={e => { setLevelFilter(e.target.value); handlePageChange(1); }}>
                            <option value="all">Tous</option>
                            <option value="erreur">Erreur</option>
                            <option value="avertissement">Avertissement</option>
                            <option value="info">Info</option>
                        </select>
                    </div>
                </form>

                <div className="space-y-3">
                    {paginatedLogs.length > 0 ? paginatedLogs.map(log => (
                        <div key={log.timestamp} className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${log.resolved ? 'opacity-60 bg-gray-100' : ''}`}>
                            <div className={`p-4 border-l-4 ${getLevelIndicatorClass(log.level)}`}>
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`badge ${getBadgeClass(log.level)}`}>{log.level}</span>
                                            <span className="font-semibold text-gray-800">{log.message}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{formatDate(log.timestamp)} ({timeAgo(log.timestamp)})</p>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        {!log.resolved && (
                                            <button
                                                className="btn btn-xs btn-success !py-1"
                                                onClick={() => handleResolveLog(log.timestamp)}
                                                title="Marquer comme résolu"
                                            >
                                                <i className="fas fa-check-circle mr-1"></i> Résolu
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-xs btn-outline-secondary !py-1"
                                            onClick={() => handleToggleDetails(log.timestamp)}
                                        >
                                            Détails <i className={`fas fa-chevron-down ml-1 transition-transform ${expandedLogTimestamp === log.timestamp ? 'rotate-180' : ''}`}></i>
                                        </button>
                                    </div>
                                </div>
                                {expandedLogTimestamp === log.timestamp && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <h4 className="font-semibold text-sm text-gray-600 mb-2">Trace de la pile :</h4>
                                        <pre className="bg-gray-900 text-white p-3 rounded-md text-xs overflow-x-auto">
                                            <code>{log.trace}</code>
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-gray-500">
                            <i className="fas fa-check-circle fa-3x text-green-400 mb-3"></i>
                            <p>Aucun log ne correspond aux filtres actuels.</p>
                        </div>
                    )}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </Card>
        </>
    );
};