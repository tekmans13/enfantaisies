import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, AlertTriangle, Pill } from "lucide-react";

interface SejourDetailsDialogProps {
  sejour: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SejourDetailsDialog({
  sejour,
  open,
  onOpenChange,
}: SejourDetailsDialogProps) {
  const [inscriptions, setInscriptions] = useState<any[]>([]);

  useEffect(() => {
    if (open && sejour) {
      fetchInscriptions();
    }
  }, [open, sejour]);

  const fetchInscriptions = async () => {
    const { data } = await supabase
      .from('inscriptions')
      .select('*')
      .or(`sejour_preference_1.eq.${sejour.id},sejour_preference_2.eq.${sejour.id}`)
      .order('child_last_name', { ascending: true });
    
    if (data) {
      setInscriptions(data);
    }
  };

  const getDietaryInfo = (inscription: any) => {
    const dietary = [];
    if (inscription.no_pork) dietary.push("Sans porc");
    if (inscription.no_meat) dietary.push("Sans viande");
    if (inscription.has_food_allergies) dietary.push("Allergies alimentaires");
    return dietary;
  };

  const validatedInscriptions = inscriptions.filter(i => i.status === 'validee');
  const pendingInscriptions = inscriptions.filter(i => i.status === 'en_attente');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl">{sejour?.titre}</h2>
              {sejour?.lieu && (
                <p className="text-sm text-muted-foreground font-normal">{sejour.lieu}</p>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {sejour?.groupe_age}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info générale */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                Période
              </div>
              <p className="font-semibold">
                {new Date(sejour?.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejour?.date_fin).toLocaleDateString('fr-FR')}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Places
              </div>
              <p className="font-semibold">
                {validatedInscriptions.length} / {sejour?.places_disponibles}
              </p>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">En attente</div>
              <p className="font-semibold text-orange-500">
                {pendingInscriptions.length}
              </p>
            </Card>
          </div>

          {/* Liste des inscrits validés */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Inscrits validés ({validatedInscriptions.length})</h3>
            {validatedInscriptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun inscrit validé</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enfant</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Régime alimentaire</TableHead>
                      <TableHead>Santé</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validatedInscriptions.map((inscription) => {
                      const dietary = getDietaryInfo(inscription);
                      return (
                        <TableRow key={inscription.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">
                                {inscription.child_first_name} {inscription.child_last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {inscription.child_gender === 'garcon' ? '👦' : '👧'} {inscription.child_class.toUpperCase()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {inscription.parent_first_name} {inscription.parent_last_name}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{inscription.parent_mobile}</p>
                              <p className="text-muted-foreground">{inscription.parent_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {dietary.length > 0 ? (
                              <div className="space-y-1">
                                {dietary.map((item, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Aucun</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {inscription.has_medication && (
                                <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                                  <Pill className="w-3 h-3" />
                                  Médicaments
                                </Badge>
                              )}
                              {inscription.has_allergies && (
                                <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3" />
                                  Allergies
                                </Badge>
                              )}
                              {!inscription.has_medication && !inscription.has_allergies && (
                                <span className="text-muted-foreground text-sm">Aucun</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Liste d'attente */}
          {pendingInscriptions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-orange-500">
                En attente de validation ({pendingInscriptions.length})
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enfant</TableHead>
                      <TableHead>Parent</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Choix</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInscriptions.map((inscription) => (
                      <TableRow key={inscription.id}>
                        <TableCell>
                          <p className="font-semibold">
                            {inscription.child_first_name} {inscription.child_last_name}
                          </p>
                        </TableCell>
                        <TableCell>
                          {inscription.parent_first_name} {inscription.parent_last_name}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{inscription.parent_mobile}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={inscription.sejour_preference_1 === sejour.id ? "default" : "outline"}>
                            {inscription.sejour_preference_1 === sejour.id ? "1er choix" : "2ème choix"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
