"use client";

import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Team, Division, Player } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const playerSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'El nombre es requerido'),
  nationality: z.string().min(1, 'La nacionalidad es requerida'),
  position: z.enum(['Goalkeeper', 'Defender', 'Midfielder', 'Forward']),
  stats: z.object({
    goals: z.number(),
    assists: z.number(),
    cleanSheets: z.number(),
    cards: z.object({ yellow: z.number(), red: z.number() }),
    mvp: z.number(),
  }),
});

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  division: z.coerce.number().min(1, 'La división es requerida'),
  logoUrl: z.string().url('Debe ser una URL de imagen válida'),
  roster: z.array(playerSchema),
});

type TeamFormData = z.infer<typeof formSchema>;

interface TeamFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (team: Team) => void;
  team: Team | null;
  divisions: Omit<Division, 'teams'>[];
}

export function TeamFormDialog({ isOpen, onOpenChange, onSave, team, divisions }: TeamFormDialogProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<TeamFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      division: undefined,
      logoUrl: '',
      roster: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'roster',
  });

  useEffect(() => {
    if (isOpen) {
        if (team) {
            reset({
                name: team.name,
                division: team.division,
                logoUrl: team.logoUrl,
                roster: team.roster || [],
            });
        } else {
            reset({
                name: '',
                division: undefined,
                logoUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
                roster: [],
            });
        }
    }
  }, [team, reset, isOpen]);

  const onSubmit = (data: TeamFormData) => {
    const division = divisions.find(d => d.id === data.division);
    if (!division) return;

    const teamToSave: Team = {
      ...(team || {} as Omit<Team, 'id' | 'roster' | 'divisionName' | 'dataAiHint' | 'stats'>),
      id: team?.id || Date.now(),
      name: data.name,
      division: data.division,
      divisionName: division.name,
      logoUrl: data.logoUrl,
      dataAiHint: team?.dataAiHint || 'custom logo',
      stats: team?.stats || { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      roster: data.roster,
    };
    onSave(teamToSave);
  };
  
  const addNewPlayer = () => {
    append({
        id: Date.now() + Math.random(), // Temporary unique ID
        name: 'Nuevo Jugador',
        nationality: 'Desconocida',
        position: 'Forward',
        stats: { goals: 0, assists: 0, cleanSheets: 0, cards: { yellow: 0, red: 0 }, mvp: 0 }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{team ? 'Gestionar Equipo' : 'Añadir Nuevo Equipo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[60vh] p-1">
                <div className="grid gap-4 py-4 pr-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                        Nombre
                        </Label>
                        <div className="col-span-3">
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="division" className="text-right">
                        División
                        </Label>
                        <div className="col-span-3">
                        <Controller
                            name="division"
                            control={control}
                            render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value ? String(field.value) : undefined}>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecciona una división" />
                                </SelectTrigger>
                                <SelectContent>
                                {divisions.map((d) => (
                                    <SelectItem key={d.id} value={String(d.id)}>
                                    {d.name}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            )}
                        />
                        {errors.division && <p className="text-red-500 text-xs mt-1">{errors.division.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="logoUrl" className="text-right">
                        URL del Logo
                        </Label>
                        <div className="col-span-3">
                        <Input id="logoUrl" {...register('logoUrl')} />
                        {errors.logoUrl && <p className="text-red-500 text-xs mt-1">{errors.logoUrl.message}</p>}
                        </div>
                    </div>

                    {team && (
                        <>
                        <div className="col-span-4">
                            <h4 className="font-medium mt-4 mb-2">Plantilla de Jugadores</h4>
                        </div>
                        {fields.map((player, index) => (
                        <div key={player.id} className="grid grid-cols-12 items-center gap-2 col-span-4">
                            <div className="col-span-5">
                                <Input placeholder="Nombre del jugador" {...register(`roster.${index}.name`)} />
                            </div>
                            <div className="col-span-5">
                                <Input placeholder="Nacionalidad" {...register(`roster.${index}.nationality`)} />
                            </div>
                            <div className="col-span-2">
                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        ))}
                         <div className="col-span-4 mt-2">
                            <Button type="button" variant="outline" onClick={addNewPlayer} className="w-full">
                                Añadir Jugador
                            </Button>
                        </div>
                        </>
                    )}
                </div>
            </ScrollArea>
          <DialogFooter className='mt-4'>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
