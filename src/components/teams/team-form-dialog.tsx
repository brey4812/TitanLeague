"use client";

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Team, Division } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  division: z.coerce.number().min(1, 'La división es requerida'),
  logoUrl: z.string().url('Debe ser una URL de imagen válida'),
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
      name: team?.name || '',
      division: team?.division || undefined,
      logoUrl: team?.logoUrl || '',
    },
  });

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        division: team.division,
        logoUrl: team.logoUrl,
      });
    } else {
      reset({
        name: '',
        division: undefined,
        logoUrl: '',
      });
    }
  }, [team, reset, isOpen]);

  const onSubmit = (data: TeamFormData) => {
    const division = divisions.find(d => d.id === data.division);
    if (!division) return;

    const teamToSave = {
      ...(team || {} as Team),
      id: team?.id || Date.now(), // Use existing ID or generate a temporary one
      name: data.name,
      division: data.division,
      divisionName: division.name,
      logoUrl: data.logoUrl,
      dataAiHint: team?.dataAiHint || 'custom logo',
      stats: team?.stats || { wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 },
      roster: team?.roster || [],
    };
    onSave(teamToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{team ? 'Editar Equipo' : 'Añadir Nuevo Equipo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
