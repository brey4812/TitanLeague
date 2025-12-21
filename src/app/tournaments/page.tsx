import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icons } from "@/components/icons";

const PlaceholderContent = ({ title }: { title: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64 border-2 border-dashed rounded-lg">
                <Icons.Trophy className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Próximamente</p>
                <p>El cuadro y los resultados de {title} se mostrarán aquí.</p>
            </div>
        </CardContent>
    </Card>
);

export default function TournamentsPage() {
  return (
    <>
      <PageHeader
        title="Torneos"
        description="Sigue las fases eliminatorias de la Titan Champions, la Copa y la Supercopa."
      />
      <Tabs defaultValue="champions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="champions">Titan Champions</TabsTrigger>
          <TabsTrigger value="copa">Copa</TabsTrigger>
          <TabsTrigger value="supercopa">Supercopa</TabsTrigger>
        </TabsList>
        <TabsContent value="champions" className="mt-6">
          <PlaceholderContent title="Titan Champions" />
        </TabsContent>
        <TabsContent value="copa" className="mt-6">
          <PlaceholderContent title="Copa del Titán" />
        </TabsContent>
        <TabsContent value="supercopa" className="mt-6">
            <PlaceholderContent title="Supercopa Titán" />
        </TabsContent>
      </Tabs>
    </>
  );
}
