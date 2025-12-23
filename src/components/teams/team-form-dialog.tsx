"use client";

import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, UserPlus, Image as ImageIcon, Crosshair } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

// Esquema alineado con Player interface de types.ts
const playerSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().min(1, 'Nombre requerido'),
  nationality: z.string().min(1, 'País requerido'),
  position: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward']),
  face_url: z.string().optional().nullable().or(z.literal('')),
  rating: z.coerce.number().min(1).max(99).default(70),
  // Mantenemos las stats para no borrarlas al editar
  stats: z.any().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, 'Nombre de equipo requerido'),
  country: z.string().min(1, 'País de equipo requerido'),
  division: z.coerce.number().min(1, 'División requerida'),
  badge_url: z.string().optional().nullable().or(z.literal('')),
  roster: z.array(playerSchema),
});

type TeamFormData = z.infer<typeof formSchema>;

export function TeamFormDialog({ isOpen, onOpenChange, onSave, team, divisions }: any) {
  const { register, handleSubmit, control, reset, getValues } = useForm<TeamFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', country: '', division: 0, badge_url: '', roster: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'roster' });

  // EFECTO CORREGIDO: Mantiene las posiciones y datos existentes al abrir
  useEffect(() => {
    if (isOpen && team) {
      reset({
        name: team.name || '',
        country: team.country || '',
        division: team.division_id || team.division || 0,
        badge_url: team.badge_url || team.logo || '',
        roster: (team.roster || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          nationality: p.nationality || p.country || 'Spain',
          // Verificamos que la posición sea válida para el enum, si no 'Forward'
          position: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].includes(p.position) 
                    ? p.position 
                    : 'Forward',
          face_url: p.face_url || '',
          rating: p.rating || 70,
          stats: p.stats || { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 }
        })),
      });
    }
  }, [team, reset, isOpen]);

  const onSubmit = (data: TeamFormData) => {
    onSave({
      ...team,
      id: team?.id || Date.now(),
      name: data.name,
      country: data.country,
      division_id: Number(data.division),
      badge_url: data.badge_url || '/placeholder-team.png',
      // Mantenemos la integridad de los datos de los jugadores
      roster: data.roster.map(p => ({
        ...p,
        rating: Number(p.rating)
      })).slice(0, 25), // Permitimos un poco más de margen si es necesario
    });
    onOpenChange(false);
  };

  const addNewPlayer = () => {
    const currentCountry = getValues('country');
    append({ 
      id: `manual-${Date.now()}`, 
      name: '', 
      nationality: currentCountry || 'Spain', 
      position: 'Forward', 
      face_url: '',
      rating: 70, 
      stats: { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 } 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            {team ? 'Configurar Club' : 'Crear Nuevo Club'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ajusta los detalles del equipo y gestiona tu plantilla de jugadores.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ScrollArea className="max-h-[70vh] px-1">
            <div className="grid gap-6 p-1">
              {/* SECCIÓN EQUIPO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border-2">
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">Nombre del Equipo</Label>
                  <Input {...register('name')} placeholder="Ej: Real Madrid" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">País de Origen</Label>
                  <Input {...register('country')} placeholder="Ej: España" className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">División</Label>
                  <Controller name="division" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={String(field.value)}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                      <SelectContent>
                        {divisions.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px]">URL Logo (Escudo)</Label>
                  <Input {...register('badge_url')} placeholder="https://..." className="bg-white" />
                </div>
              </div>

              {/* SECCIÓN PLANTILLA */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <h3 className="font-black uppercase italic tracking-tighter text-lg">Plantilla ({fields.length})</h3>
                  <Button type="button" onClick={addNewPlayer} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="h-4 w-4 mr-2" /> Fichar Jugador
                  </Button>
                </div>

                <div className="grid gap-3">
                  {fields.map((p, i) => (
                    <div key={p.id} className="group relative bg-white p-4 rounded-xl border-2 hover:border-blue-500 transition-all shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        
                        <div className="md:col-span-4 space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                             <ImageIcon className="h-3 w-3" /> Jugador & Foto
                          </Label>
                          <div className="flex gap-2">
                            <div className="h-10 w-10 shrink-0 rounded-full border-2 bg-slate-100 overflow-hidden">
                               <img 
                                 src={getValues(`roster.${i}.face_url`) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getValues(`roster.${i}.name`) || p.id}`} 
                                 className="h-full w-full object-cover" 
                                 alt=""
                                 onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`; }}
                               />
                            </div>
                            <Input {...register(`roster.${i}.name`)} placeholder="Nombre" className="h-10" />
                          </div>
                        </div>

                        <div className="md:col-span-3 space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                            <Crosshair className="h-3 w-3" /> Posición (IA)
                          </Label>
                          <Controller name={`roster.${i}.position`} control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Goalkeeper">Portero</SelectItem>
                                <SelectItem value="Defender">Defensa</SelectItem>
                                <SelectItem value="Midfielder">Medio</SelectItem>
                                <SelectItem value="Forward">Delantero</SelectItem>
                              </SelectContent>
                            </Select>
                          )} />
                        </div>

                        <div className="md:col-span-4 grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Media</Label>
                            <Input type="number" {...register(`roster.${i}.rating`)} className="h-10" />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[9px] font-black uppercase text-muted-foreground">País</Label>
                             <Input {...register(`roster.${i}.nationality`)} className="h-10" />
                          </div>
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="text-red-500 hover:bg-red-50">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="md:col-span-12 mt-2">
                           <Input {...register(`roster.${i}.face_url`)} placeholder="URL de la cara (opcional)" className="h-7 text-[10px] bg-slate-50 border-dashed" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4">
            <Button type="submit" className="w-full h-12 text-lg font-black uppercase bg-blue-600 hover:bg-blue-700 shadow-lg">
                Guardar Cambios en la Liga
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}