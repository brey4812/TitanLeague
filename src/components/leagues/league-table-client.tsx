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
                description: 'Could not find table to download.',
                variant: 'destructive'
            });
            return;
        }

        toast({
            title: 'Generating Image...',
            description: 'Please wait while we create the image.'
        });

        try {
            const canvas = await html2canvas(tableRef.current, {
                useCORS: true,
                backgroundColor: null, // Use transparent background
            });
            const link = document.createElement('a');
            link.download = `${division.name.toLowerCase().replace(/\s/g, '-')}-table.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Download Failed',
                description: 'Something went wrong while generating the image.',
                variant: 'destructive'
            });
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-4">
                <Button onClick={handleDownload} variant="outline">
                    <Icons.Download className="mr-2 h-4 w-4" />
                    Download as Image
                </Button>
            </div>
            <div ref={tableRef}>
                <LeagueTable division={division} />
            </div>
        </div>
    );
}
