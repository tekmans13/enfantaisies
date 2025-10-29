import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface InscriptionStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function InscriptionStatusBadge({ status, size = "md" }: InscriptionStatusBadgeProps) {
  const iconSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  const textSize = size === "sm" ? "text-xs px-2 py-0" : "text-xs";
  
  if (status === 'en_attente') {
    return (
      <Badge variant="outline" className={`bg-orange-500/10 text-orange-500 border-orange-500 ${textSize}`}>
        <Clock className={`${iconSize} mr-1`} />
        En attente
      </Badge>
    );
  }
  
  if (status === 'attribuee' || status === 'attribuee_alternatif') {
    return (
      <Badge variant="outline" className={`bg-green-500/10 text-green-500 border-green-500 ${textSize}`}>
        <CheckCircle className={`${iconSize} mr-1`} />
        Attribuée
      </Badge>
    );
  }
  
  if (status === 'validee') {
    return (
      <Badge variant="outline" className={`bg-blue-500/10 text-blue-500 border-blue-500 ${textSize}`}>
        <CheckCircle className={`${iconSize} mr-1`} />
        Validée
      </Badge>
    );
  }
  
  if (status === 'refusee') {
    return (
      <Badge variant="outline" className={`bg-red-500/10 text-red-500 border-red-500 ${textSize}`}>
        <XCircle className={`${iconSize} mr-1`} />
        Refusée
      </Badge>
    );
  }
  
  return <Badge variant="outline" className={textSize}>{status}</Badge>;
}
