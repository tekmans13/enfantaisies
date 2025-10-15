import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SmtpConfigDialog } from "@/components/SmtpConfigDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Shield, User, Trash2, ArrowLeft } from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role?: "admin" | "user";
}

export default function Users() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    role: "user" as "admin" | "user",
  });

  useEffect(() => {
    checkAdminAndFetchUsers();
  }, []);

  const checkAdminAndFetchUsers = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (!isAdmin) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être administrateur",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      await fetchUsers();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) return;

      // Call edge function to get users list
      const { data, error } = await supabase.functions.invoke("get-users-list", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs",
          variant: "destructive",
        });
        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // Call edge function to create user
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: newUser.email,
          role: newUser.role,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${newUser.email} a été créé avec succès. Un email avec le mot de passe a été envoyé.`,
      });

      setIsDialogOpen(false);
      setNewUser({ email: "", role: "user" });
      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: "admin" | "user") => {
    try {
      // Delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: "Rôle modifié",
        description: "Le rôle a été mis à jour avec succès",
      });

      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // Call edge function to delete user
      const { error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Utilisateur supprimé",
        description: `L'utilisateur ${userEmail} a été supprimé avec succès`,
      });

      await fetchUsers();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/bureau")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
              <p className="text-muted-foreground">
                Créez et gérez les comptes administrateurs
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <SmtpConfigDialog />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nouvel utilisateur
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau compte utilisateur ou administrateur
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="utilisateur@example.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Un mot de passe sera généré et envoyé par email
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: "admin" | "user") =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Création..." : "Créer l'utilisateur"}
                </Button>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              {users.length} utilisateur{users.length > 1 ? "s" : ""} enregistré
              {users.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge
                          variant={user.role === "admin" ? "default" : "secondary"}
                        >
                          {user.role === "admin" ? (
                            <Shield className="mr-1 h-3 w-3" />
                          ) : (
                            <User className="mr-1 h-3 w-3" />
                          )}
                          {user.role === "admin" ? "Admin" : "Utilisateur"}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Aucun rôle</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role || "none"}
                          onValueChange={(value) => {
                            if (value !== "none") {
                              handleChangeRole(user.id, value as "admin" | "user");
                            }
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Modifier rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Utilisateur</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="none" disabled>
                              Aucun rôle
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer l'utilisateur {user.email} ?
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
