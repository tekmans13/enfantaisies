import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

export default function Bureau() {
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, garcons: 0, filles: 0, enAttente: 0 });

  useEffect(() => {
    fetchInscriptions();
  }, []);

  const fetchInscriptions = async () => {
    const { data, error } = await supabase
      .from('inscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setInscriptions(data);
      
      // Calculer les statistiques
      const total = data.length;
      const garcons = data.filter(i => i.child_gender === 'garcon').length;
      const filles = data.filter(i => i.child_gender === 'fille').length;
      const enAttente = data.filter(i => i.status === 'en_attente').length;
      
      setStats({ total, garcons, filles, enAttente });
    }
  };

  const handleValidate = async (id: string, status: 'validee' | 'refusee') => {
    const { error } = await supabase
      .from('inscriptions')
      .update({ 
        status,
        validated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      fetchInscriptions();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Gestion Bureau - Centre Aéré
            </h1>
            <p className="text-muted-foreground">
              Tableau de bord des inscriptions
            </p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Inscrits</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Garçons</p>
                <p className="text-2xl font-bold text-foreground">{stats.garcons}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Filles</p>
                <p className="text-2xl font-bold text-foreground">{stats.filles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold text-foreground">{stats.enAttente}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Table des inscriptions */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Liste des inscriptions</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enfant</TableHead>
                  <TableHead>Âge/Groupe</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscriptions.map((inscription) => (
                  <TableRow key={inscription.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{inscription.child_first_name} {inscription.child_last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {inscription.child_gender === 'garcon' ? '👦' : '👧'} {inscription.child_class}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {inscription.child_age_group || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inscription.parent_first_name} {inscription.parent_last_name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{inscription.parent_email}</p>
                        <p className="text-muted-foreground">{inscription.parent_mobile}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {inscription.status === 'en_attente' && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500">
                          <Clock className="w-3 h-3 mr-1" />
                          En attente
                        </Badge>
                      )}
                      {inscription.status === 'validee' && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Validée
                        </Badge>
                      )}
                      {inscription.status === 'refusee' && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          Refusée
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(inscription.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {inscription.status === 'en_attente' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleValidate(inscription.id, 'validee')}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleValidate(inscription.id, 'refusee')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
