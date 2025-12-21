"use client";

import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LeagueTable } from './league-table';
import type { Division } from '@/lib/types';
import { Icons } from '../icons';

interface LeagueTableClientProps {
    division: Division;
}

export function LeagueTableClient({ division }: LeagueTableClientProps) {
    const { toast } = useToast();
    const tableRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!tableRef.current) {
            toast({
                title: 'Error',
                description: 'No se pudo encontrar la tabla para descargar.',
                variant: 'destructive'
            });
            return;
        }

        toast({
            title: 'Generando Imagen...',
            description: 'Por favor espera mientras creamos la imagen.'
        });

        try {
            const canvas = await html2canvas(tableRef.current, {
                useCORS: true,
                backgroundColor: null, // Use transparent background
            });
            const link = document.createElement('a');
            link.download = `${division.name.toLowerCase().replace(/\s/g, '-')}-tabla.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Descarga Fallida',
                description: 'Algo salió mal mientras se generaba la imagen.',
                variant: 'destructive'
            });
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleDownload} variant="outline">
                    <Icons.Download className="mr-2 h-4 w-4" />
                    Descargar como Imagen
                </Button>
            </div>
            <div ref={tableRef}>
                <LeagueTable division={division} />
            </div>
        </div>
    );
}
