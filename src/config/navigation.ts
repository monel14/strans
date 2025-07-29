
import { NavLink } from '../types';

// Import Page Components
import { AgentDashboard } from '../features/agent/AgentDashboard';
import { AgentTransactionHistory } from '../features/agent/AgentTransactionHistory';

import { ChefAgenceDashboard } from '../features/chef_agence/ChefAgenceDashboard';
import { ChefManageAgents } from '../features/chef_agence/ChefManageAgents';
import { ChefAgenceHistory } from '../features/chef_agence/ChefAgenceHistory';
import { ChefCommissions } from '../features/chef_agence/ChefCommissions';

import { AdminGeneralDashboard } from '../features/admin/AdminGeneralDashboard';
import { AdminTransactionManagement } from '../features/admin/AdminTransactionManagement';
import { AdminRequestManagement } from '../features/admin/AdminRequestManagement';
import { AdminManagementPage } from '../features/admin/AdminManagementPage';

import { SousAdminTransactionManagement } from '../features/sous_admin/SousAdminTransactionManagement';
import { SousAdminRequestManagement } from '../features/sous_admin/SousAdminRequestManagement';

import { DevDashboard } from '../features/developpeur/DevDashboard';
import { DevManageOperationTypes } from '../features/developpeur/DevManageOperationTypes';
import { DevSystemConfig } from '../features/developpeur/DevSystemConfig';
import { DevErrorLogs } from '../features/developpeur/DevErrorLogs';



import { SubmitRequestPage } from '../features/common/SubmitRequestPage';


export const navigationLinks: { [role: string]: NavLink[] } = {
    agent: [
        { key: 'Tableau de Bord', label: 'Tableau de Bord', icon: 'fa-chart-pie', component: AgentDashboard },
        { key: 'Opérations', label: 'Opérations', icon: 'fa-exchange-alt', component: AgentTransactionHistory },
        { key: 'Requêtes', label: 'Requêtes', icon: 'fa-headset', component: SubmitRequestPage },
    ],
    chef_agence: [
        { key: 'Tableau de Bord', label: 'Tableau de Bord', icon: 'fa-chart-line', component: ChefAgenceDashboard },
        { key: 'Gestion des Agents', label: 'Gestion des Agents', icon: 'fa-users-cog', component: ChefManageAgents },
        { key: 'Historique Agence', label: 'Historique Agence', icon: 'fa-landmark', component: ChefAgenceHistory },
        { key: 'Mes Commissions', label: 'Mes Commissions', icon: 'fa-percent', component: ChefCommissions },
        { key: 'Mes Requêtes', label: 'Mes Requêtes', icon: 'fa-headset', component: SubmitRequestPage },
    ],
    admin_general: [
        { key: 'Tableau de Bord Global', label: 'Tableau de Bord Global', icon: 'fa-globe-americas', component: AdminGeneralDashboard },
        { key: 'Gestion des Transactions', label: 'Gestion des Transactions', icon: 'fa-cogs', component: AdminTransactionManagement },
        { key: 'Gestion des Requêtes', label: 'Gestion des Requêtes', icon: 'fa-headset', component: AdminRequestManagement },
        { key: 'Gestion & Administration', label: 'Gestion & Admin', icon: 'fa-users-cog', component: AdminManagementPage },
    ],
    sous_admin: [
        { key: 'Gestion des Transactions', label: 'Gestion des Transactions', icon: 'fa-check-square', component: SousAdminTransactionManagement },
        { key: 'Gestion des Requêtes', label: 'Gestion des Requêtes', icon: 'fa-headset', component: SousAdminRequestManagement },
    ],
    developpeur: [
        { key: 'Dashboard Technique', label: 'Dashboard Technique', icon: 'fa-server', component: DevDashboard },
        { key: 'Types d\'Opérations', label: 'Types d\'Opérations', icon: 'fa-cogs', component: DevManageOperationTypes },
        { key: 'Configuration Globale', label: 'Configuration Globale', icon: 'fa-tools', component: DevSystemConfig },
        { key: 'Journaux d\'Erreurs', label: 'Journaux d\'Erreurs', icon: 'fa-bug', component: DevErrorLogs },
    ]
};
