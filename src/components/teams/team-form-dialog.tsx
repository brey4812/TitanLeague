"use client";

import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Team, Player } from '@/lib/types';
import { Trash2, UserPlus } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const playerSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().min(1, 'Requerido'),
  nationality: z.string().min(1, 'Requerido'),
  position: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward']),
  image_url: z.string().optional().nullable(),
  rating: z.number().default(70),
  stats: z.object({
    goals: z.number().default(0),
    assists: z.number().default(0),
    cleanSheets: z.number().default(0),
    cards: z.object({ yellow: z.number().default(0), red: z.number().default(0) }),
    mvp: z.number().default(0),
  }),
});

const formSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  country: z.string().min(1, 'Requerido'),
  division: z.coerce.number().min(1, 'Requerido'),
  badge_url: z.string().optional().nullable().or(z.literal('')),
  roster: z.array(playerSchema),
});

type TeamFormData = z.infer<typeof formSchema>;

export function TeamFormDialog({ isOpen, onOpenChange, onSave, team, divisions }: any) {
  // Añadimos getValues para poder leer el país actual
  const { register, handleSubmit, control, reset, getValues, formState: { errors } } = useForm<TeamFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', country: '', division: 0, badge_url: '', roster: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'roster' });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: team?.name || '',
        country: team?.country || '',
        division: team?.division ? Number(team.division) : undefined,
        badge_url: team?.badge_url || team?.logo || '',
        roster: team?.roster || [],
      } as any);
    }
  }, [team, reset, isOpen]);

  const onSubmit = (data: TeamFormData) => {
    const div = divisions.find((d: any) => Number(d.id) === Number(data.division));
    onSave({
      ...team,
      id: team?.id || Date.now(),
      name: data.name,
      country: data.country,
      division: Number(data.division),
      divisionName: div?.name || 'Sin División',
      badge_url: data.badge_url || '/placeholder-team.png',
      logo: data.badge_url || '/placeholder-team.png',
      stats: team?.stats || { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      roster: data.roster.slice(0, 20),
    });
    onOpenChange(false);
  };

  // Función corregida para añadir jugador
  const addNewPlayer = () => {
    // Obtenemos el país actual del formulario usando getValues()
    const currentCountry = getValues('country');
    
    append({ 
      id: `manual-${Date.now()}`, 
      name: '', 
      nationality: currentCountry || 'Desconocida', // Usamos el país del formulario o uno por defecto
      position: 'Midfielder', 
      rating: 70, 
      stats: { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 } 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{team ? 'Editar Equipo' : 'Nuevo Equipo'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre</Label><Input {...register('name')} /></div>
                <div className="space-y-2"><Label>País</Label><Input {...register('country')} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>División</Label>
                  <Controller name="division" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                      <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                      <SelectContent>{divisions.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2"><Label>URL Logo</Label><Input {...register('badge_url')} /></div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="font-bold text-sm">Plantilla ({fields.length}/20)</p>
                <Button type="button" variant="outline" size="sm" onClick={addNewPlayer} disabled={fields.length >= 20}>
                  <UserPlus className="h-4 w-4 mr-2" /> Añadir
                </Button>
              </div>
              {fields.map((p, i) => (
                <div key={p.id} className="flex gap-2 mb-2 bg-slate-50 p-2 rounded border">
                  <Input {...register(`roster.${i}.name`)} className="flex-1" placeholder="Nombre" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4"><Button type="submit" className="w-full">Guardar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}