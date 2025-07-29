
import React from 'react';
import { Card } from './Card';
import { PageComponentProps } from '../../types';

interface PlaceholderProps extends PageComponentProps {
    title: string;
    icon: string;
}

export const PlaceholderContent: React.FC<PlaceholderProps> = ({ title, icon }) => (
    <Card title={title} icon={icon}>
        <p>Contenu pour {title} à venir.</p>
    </Card>
);
