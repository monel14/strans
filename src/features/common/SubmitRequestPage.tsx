import React, { useState, useMemo, useEffect } from 'react';
import { PageComponentProps, Request } from '../../types';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import { formatShortId } from '../../utils/idFormatters';
import { getBadgeClass } from '../../utils/uiHelpers';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { Database } from '../../types/database.types';
import { PageHeader } from '../../components/common/PageHeader';

const getStatusBorderClass = (status?: string): string => {
    if (!status) return 'border-gray-300 dark:border-gray-600';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('traité')) return 'border-green-500';
    if (lowerStatus.includes('en attente')) return 'border-blue-500';
    if (lowerStatus.includes('rejeté')) return 'border-red-500';
    return 'border-gray-300 dark:border-gray-600';
};

const RequestHistoryCard: React.FC<{ request: Request; onAction: (action: string, data?: any) => void; }> = ({ request, onAction }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border-l-4 ${getStatusBorderClass(request.status)} transition-shadow duration-300 hover:shadow-lg`}>
            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <span className={`badge ${getBadgeClass(request.status)} mb-2`}>{request.status}</span>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100">{request.sujet}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {formatShortId(request.id, 'request')} &bull; {formatDate(request.created_at)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {request.attachment_url && (
                             <button onClick={(e) => { e.stopPropagation(); onAction('viewProof', request.attachment_url); }} className="btn btn-xs btn-outline-secondary">
                                <i className="fas fa-paperclip mr-2"></i> Pièce Jointe
                             </button>
                        )}
                         <i className={`fas fa-chevron-down text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                    </div>
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div>
                        <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-1">Votre Message :</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{request.description}</p>
                    </div>
                    {request.reponse && (
                         <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                             <h5 className="font-semibold text-sm text-gray-600 dark:text-gray-300 mb-1">Réponse de l'administrateur :</h5>
                             <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{request.reponse}</p>
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};

const requestTypes = [
    { value: 'probleme_technique', label: 'Problème Technique' },
    { value: 'question_transaction', label: 'Question sur une Transaction' },
    { value: 'suggestion_amelioration', label: "Suggestion d'Amélioration" },
    { value: 'demande_information', label: "Demande d'Information" },
    { value: 'autre', label: 'Autre' },
];

export const SubmitRequestPage: React.FC<PageComponentProps> = ({ user, openModal }) => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [requestType, setRequestType] = useState('probleme_technique');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState('create');
    const ITEMS_PER_PAGE = 5;

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('requests').select('*').eq('demandeur_id', user.id).order('created_at', { ascending: false });
        if(error) handleSupabaseError(error, "Chargement de l'historique des requêtes");
        else setRequests((data as Request[]) ?? []);
        setLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchRequests();
        }
    }, [user.id, activeTab]);

    const totalPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
    const paginatedRequests = useMemo(() => requests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [requests, currentPage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        let attachment_url: string | null = null;
        if (attachment) {
            const { data, error } = await supabase.storage.from('attachments').upload(`${user.id}/${Date.now()}-${attachment.name}`, attachment);
            if (error) { handleSupabaseError(error, "Téléversement de la pièce jointe"); setIsSubmitting(false); return; }
            const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(data.path);
            attachment_url = urlData.publicUrl;
        }

        let finalDescription = description;
        if (requestType === 'question_transaction' && transactionId.trim() !== '') {
            finalDescription = `ID Transaction: ${transactionId.trim()}\n\n${description}`;
        }

        const newRequest: Database['public']['Tables']['requests']['Insert'] = { demandeur_id: user.id, type: requestType, sujet: subject, description: finalDescription, attachment_url };
        const { data: insertedData, error: insertError } = await supabase.from('requests').insert(newRequest).select().single();

        if (insertError || !insertedData) {
            handleSupabaseError(insertError, "Création de la requête");
            setIsSubmitting(false);
            return;
        }
        
        console.log("Requête envoyée avec succès !");

        // Notifier les administrateurs
        const { error: rpcError } = await supabase.rpc('notify_admins_new_request', { p_request_id: insertedData.id });
        if (rpcError) {
            // Erreur non critique, on continue
            console.warn("Could not notify admins", rpcError);
            handleSupabaseError(rpcError, "Notification des administrateurs");
        }
        
        // Reset form
        setSubject('');
        setDescription('');
        setAttachment(null);
        setTransactionId('');
        setRequestType('probleme_technique');
        const fileInput = document.getElementById('requestAttachment') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Switch to history tab
        setActiveTab('history');
        setIsSubmitting(false);
    };
    
    const isFormInvalid = !subject || !description || isSubmitting;

    return (
        <>
            <PageHeader title="Mes Requêtes & Support" subtitle="Soumettez une nouvelle requête ou consultez l'historique de vos demandes." icon="fa-headset" gradient="from-slate-500 to-slate-600" />
            <div className="tabs">
                <button onClick={() => setActiveTab('create')} className={activeTab === 'create' ? 'active' : ''}><i className="fas fa-paper-plane mr-2"></i> Créer une Requête</button>
                <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}><i className="fas fa-history mr-2"></i> Mon Historique ({requests.length})</button>
            </div>
            
            {activeTab === 'create' && (
                <Card title="Nouvelle Requête" icon="fa-edit">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="form-label" htmlFor="requestType">Type de Requête</label>
                                <select id="requestType" className="form-select" value={requestType} onChange={e => setRequestType(e.target.value)}>
                                    {requestTypes.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="form-label" htmlFor="requestSubject">Sujet</label>
                                <input type="text" id="requestSubject" className="form-input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Sujet concis de votre requête" required />
                            </div>
                        </div>

                        {requestType === 'question_transaction' && (
                            <div>
                                <label className="form-label" htmlFor="transactionId">ID de la Transaction (Optionnel)</label>
                                <input type="text" id="transactionId" className="form-input" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Entrez l'ID de la transaction concernée" />
                            </div>
                        )}

                        <div>
                            <label className="form-label" htmlFor="requestDescription">Description Détaillée</label>
                            <textarea id="requestDescription" className="form-textarea" rows={5} value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez clairement votre problème ou suggestion..." required></textarea>
                        </div>
                        
                        <div>
                            <label className="form-label" htmlFor="requestAttachment">Pièce jointe (optionnel)</label>
                            <input type="file" id="requestAttachment" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/50 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900" onChange={e => setAttachment(e.target.files ? e.target.files[0] : null)} />
                        </div>

                        <div className="text-right pt-4">
                            <button type="submit" className="btn btn-primary" disabled={isFormInvalid}>
                                <i className={`fas ${isSubmitting ? 'fa-spinner animate-spin' : 'fa-paper-plane'} mr-2`}></i>
                                {isSubmitting ? 'Envoi...' : 'Envoyer la Requête'}
                            </button>
                        </div>
                    </form>
                </Card>
            )}

            {activeTab === 'history' && (
                <Card title="Historique de Mes Requêtes" icon="fa-history">
                    {loading ? <p className="text-center p-8">Chargement de l'historique...</p> : paginatedRequests.length > 0 ? (
                        <div className="space-y-4">
                            {paginatedRequests.map(request => <RequestHistoryCard key={request.id} request={request} onAction={openModal} />)}
                            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                        </div>
                    ) : (
                        <div className="text-center p-8 text-gray-500"><i className="fas fa-inbox fa-3x mb-4 text-gray-400"></i><p>Vous n'avez soumis aucune requête pour le moment.</p></div>
                    )}
                </Card>
            )}
        </>
    );
};