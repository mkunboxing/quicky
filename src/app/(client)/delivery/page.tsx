'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

const supabaseUrl = 'https://qffwvcllmuxudbqgnvhj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZnd2Y2xsbXV4dWRicWdudmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDIyODc0NSwiZXhwIjoyMDM5ODA0NzQ1fQ.g3nKd5f2irVsFjc_lKggrLL5AqGeYkik_a_4tfv5wbE';
const supabase = createClient(supabaseUrl, supabaseKey);

interface DeliveryPerson {
    id: number;
    name: string;
    avatar_url?: string;
}

const DeliveryPersonsOverview: React.FC = () => {
    const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        // Request notification permission
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                console.log(`Notification permission: ${permission}`);
            });
        } else {
            console.log(`Notification already ${Notification.permission}`);
        }

        const fetchDeliveryPersons = async () => {
            try {
                const { data, error } = await supabase
                    .from('delivery_persons')
                    .select("*");

                if (error) throw error;

                setDeliveryPersons(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching delivery persons:', error);
                setIsError(true);
                setIsLoading(false);
            }
        };

        fetchDeliveryPersons();

        const channel = supabase
            .channel('delivery_persons_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'delivery_persons' }, 
                (payload) => {
                    console.log('Change received!', payload);
                    if (payload.eventType === 'INSERT') {
                        const newPerson = payload.new as DeliveryPerson;
                        setDeliveryPersons((prev) => [...prev, newPerson]);
                        showNotification('New Delivery Person', `${newPerson.name} has been added.`);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedPerson = payload.new as DeliveryPerson;
                        setDeliveryPersons((prev) =>
                            prev.map((person) =>
                                person.id === updatedPerson.id ? { ...person, ...updatedPerson } : person
                            )
                        );
                        showNotification('Delivery Person Updated', `${updatedPerson.name}'s information has been updated.`);
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;
                        const deletedPerson = deliveryPersons.find(person => person.id === deletedId);
                        setDeliveryPersons((prev) =>
                            prev.filter((person) => person.id !== deletedId)
                        );
                        showNotification('Delivery Person Removed', `${deletedPerson?.name || 'A delivery person'} has been removed.`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const showNotification = (title: string, body: string) => {
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body });
                } else {
                    console.log('Notification permission denied.');
                }
            });
        } else {
            console.log('Notifications are blocked.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (isError) {
        return <div className="text-red-500">Error loading delivery persons.</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Delivery Persons Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4">Total Delivery Persons: {deliveryPersons.length}</p>
                <div className="space-y-4">
                    {deliveryPersons.map((person) => (
                        <div key={person.id} className="flex items-center space-x-4">
                            <Avatar>
                                <AvatarImage src={person.avatar_url} alt={person.name} />
                                <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{person.name}</span>
                            {/* @ts-ignore */}
                            <span>{person.order_id}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default DeliveryPersonsOverview;
