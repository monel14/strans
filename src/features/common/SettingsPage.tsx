import React, { useState } from 'react';
import { PageComponentProps } from '../../types';
import { Card } from '../../components/common/Card';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import PushNotificationTest from '../../components/notifications/PushNotificationTest';

interface SettingsPageProps extends PageComponentProps {
    notificationSettings: { email: boolean; inApp: boolean };
    onNotificationSettingsChange: (settings: { email: boolean; inApp: boolean }) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ notificationSettings, onNotificationSettingsChange }) => {
    const [showPushTest, setShowPushTest] = useState(false);

    const handleNotifChange = (key: 'email' | 'inApp', value: boolean) => {
        onNotificationSettingsChange({
            ...notificationSettings,
            [key]: value,
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
             <h1 className="text-3xl font-bold text-gray-800 mb-6">Paramètres</h1>
              <Card title="Notifications" icon="fa-bell">
                <div className="divide-y divide-gray-200">
                    <div className="flex justify-between items-center p-4">
                         <div>
                            <h4 className="font-semibold text-lg text-gray-700">Notifications par Email</h4>
                            <p className="text-sm text-gray-500">Recevoir des résumés et alertes importantes par email.</p>
                        </div>
                        <ToggleSwitch checked={notificationSettings.email} onChange={(checked) => handleNotifChange('email', checked)} />
                    </div>
                     <div className="flex justify-between items-center p-4">
                         <div>
                            <h4 className="font-semibold text-lg text-gray-700">Notifications dans l'Application</h4>
                            <p className="text-sm text-gray-500">Afficher les badges et pop-ups de notification.</p>
                        </div>
                        <ToggleSwitch checked={notificationSettings.inApp} onChange={(checked) => handleNotifChange('inApp', checked)} />
                    </div>
                </div>
             </Card>

             {/* Section Notifications Push */}
             <Card title="Notifications Push" icon="fa-mobile-alt" className="mt-6">
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h4 className="font-semibold text-lg text-gray-700">Test des Notifications Push</h4>
                            <p className="text-sm text-gray-500">Configurez et testez les notifications push sur votre appareil.</p>
                        </div>
                        <button
                            onClick={() => setShowPushTest(!showPushTest)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {showPushTest ? 'Masquer' : 'Configurer'}
                        </button>
                    </div>
                    
                    {showPushTest && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                            <PushNotificationTest />
                        </div>
                    )}
                </div>
             </Card>
        </div>
    );
};
