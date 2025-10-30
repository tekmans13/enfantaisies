/**
 * Page d'accueil de l'application
 * Présente le centre aéré et permet d'accéder au formulaire d'inscription
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, FileCheck } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-secondary to-primary py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
            Centre Aéré ENFANTAISIES
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Inscription simple et rapide pour les séjours et animations de votre enfant
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/inscription")}
            className="bg-white text-primary hover:bg-white/90 shadow-lg text-lg px-8 py-6"
          >
            Commencer l'inscription
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Pourquoi choisir notre centre ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 shadow-soft hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                Groupes adaptés
              </h3>
              <p className="text-muted-foreground">
                Pitchouns, Minots et Mias : chaque enfant dans le groupe qui lui correspond
              </p>
            </Card>

            <Card className="p-6 shadow-soft hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                Séjours variés
              </h3>
              <p className="text-muted-foreground">
                Animations au centre ou séjours découverte selon vos préférences
              </p>
            </Card>

            <Card className="p-6 shadow-soft hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                Inscription simplifiée
              </h3>
              <p className="text-muted-foreground">
                Formulaire progressif, validation du bureau et suivi en ligne
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">
            Prêt à inscrire votre enfant ?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Le processus est simple, rapide et conçu pour être accessible à tous
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/inscription")}
            className="text-lg px-8 py-6"
          >
            Démarrer l'inscription
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
