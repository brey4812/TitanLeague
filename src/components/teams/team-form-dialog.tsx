"use client";

import { useEffect, useContext } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, UserPlus, Image as ImageIcon, Crosshair, AlertCircle } from 'lucide-react';
import { LeagueContext } from '@/context/league-context';
import { toast } from 'sonner';

// Esquema alineado con Player interface
const playerSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().min(1, 'Nombre requerido'),
  nationality: z.string().min(1, 'País requerido'),
  position: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward']),
  face_url: z.string().optional().nullable().or(z.literal('')),
  rating: z.coerce.number().min(1).max(99).default(70),
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
  const { teams } = useContext(LeagueContext);
  
  const { register, handleSubmit, control, reset, getValues } = useForm<TeamFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', country: '', division: 0, badge_url: '', roster: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'roster' });

  useEffect(() => {
    if (isOpen && team) {
      reset({
        name: team.name || '',
        country: team.country || '',
        division: team.division_id || team.division || 1,
        badge_url: team.badge_url || team.logo || '',
        roster: (team.roster || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          nationality: p.nationality || p.country || 'Spain',
          position: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].includes(p.position) ? p.position : 'Forward',
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
      roster: data.roster.map(p => ({
        ...p,
        rating: Number(p.rating)
      })),
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
      <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            {team ? 'Configurar Club' : 'Crear Nuevo Club'}
          </DialogTitle>
          <DialogDescription>
            Gestiona los datos generales y la plantilla de jugadores del equipo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {/* CONTENEDOR CON SCROLL PARA EL FORMULARIO */}
          <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6 custom-scrollbar">
            
            {/* SECCIÓN EQUIPO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-slate-500 tracking-widest">Nombre del Equipo</Label>
                <Input {...register('name')} placeholder="Ej: Bayern Munich" className="bg-white h-11 border-2 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-slate-500 tracking-widest">País de Origen</Label>
                <Input {...register('country')} placeholder="Ej: Alemania" className="bg-white h-11 border-2 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-slate-500 tracking-widest">División</Label>
                <Controller name="division" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <SelectTrigger className="bg-white h-11 border-2">
                      <SelectValue placeholder="Elegir división..." />
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map((d: any) => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] text-slate-500 tracking-widest">URL Logo (Escudo)</Label>
                <Input {...register('badge_url')} placeholder="https://url-del-escudo.png" className="bg-white h-11 border-2 focus-visible:ring-blue-500" />
              </div>
            </div>

            {/* SECCIÓN PLANTILLA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-4 border-slate-900 pb-3 sticky top-0 bg-white z-10 pt-2">
                <h3 className="font-black uppercase italic tracking-tighter text-xl flex items-center gap-2">
                  Plantilla Actual <span className="bg-blue-600 text-white text-xs not-italic px-2 py-1 rounded-md">{fields.length}</span>
                </h3>
                <Button type="button" onClick={addNewPlayer} size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold shadow-md">
                  <UserPlus className="h-4 w-4 mr-2" /> Fichar Manual
                </Button>
              </div>

              {/* LISTA DE JUGADORES */}
              <div className="grid gap-4 pb-4">
                {fields.map((p, i) => (
                  <div key={p.id} className="group relative bg-white p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-400 transition-all shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                      
                      {/* FOTO Y NOMBRE */}
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                           <ImageIcon className="h-3 w-3" /> Jugador & Foto
                        </Label>
                        <div className="flex gap-3 items-center">
                          <div className="h-12 w-12 shrink-0 rounded-full border-2 border-slate-200 bg-slate-50 overflow-hidden shadow-inner">
                             <img 
                               src={getValues(`roster.${i}.face_url`) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${getValues(`roster.${i}.name`) || i}`} 
                               className="h-full w-full object-cover" 
                               alt="preview"
                             />
                          </div>
                          <Input {...register(`roster.${i}.name`)} placeholder="Nombre del jugador" className="h-11 border-2" />
                        </div>
                      </div>

                      {/* POSICIÓN */}
                      <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                          <Crosshair className="h-3 w-3" /> Posición
                        </Label>
                        <Controller name={`roster.${i}.position`} control={control} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-11 border-2 font-bold text-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Goalkeeper" className="font-bold text-orange-600">POR - Portero</SelectItem>
                              <SelectItem value="Defender" className="font-bold text-blue-600">DEF - Defensa</SelectItem>
                              <SelectItem value="Midfielder" className="font-bold text-green-600">MED - Medio</SelectItem>
                              <SelectItem value="Forward" className="font-bold text-red-600">DEL - Delantero</SelectItem>
                            </SelectContent>
                          </Select>
                        )} />
                      </div>

                      {/* MEDIA Y PAÍS */}
                      <div className="md:col-span-3 grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400">Media</Label>
                          <Input type="number" {...register(`roster.${i}.rating`)} className="h-11 border-2 text-center font-black text-blue-600" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-slate-400">País</Label>
                           <Input {...register(`roster.${i}.nationality`)} className="h-11 border-2" />
                        </div>
                      </div>

                      {/* ELIMINAR */}
                      <div className="md:col-span-1 flex justify-center pt-5 md:pt-0">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="text-red-500 hover:bg-red-50 rounded-full h-11 w-11 transition-colors">
                          <Trash2 className="h-6 w-6" />
                        </Button>
                      </div>

                      {/* URL CARA OCULTA PERO ACCESIBLE */}
                      <div className="md:col-span-12">
                         <Input {...register(`roster.${i}.face_url`)} placeholder="URL de la cara del jugador (Opcional)" className="h-8 text-[10px] bg-slate-50 border-dashed border-2 opacity-60 focus:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PIE DE PÁGINA FIJO */}
          <DialogFooter className="p-6 border-t bg-slate-50 shrink-0">
            <Button type="submit" className="w-full h-14 text-xl font-black uppercase bg-blue-600 hover:bg-blue-700 shadow-xl active:scale-95 transition-all">
                Guardar Cambios del Club
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}