import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PlaceholderProps {
  title: string;
  description: string;
}

/**
 * The shell, route and auth guard are in place for every documented screen;
 * the screens themselves are built one at a time against admin-ui/API-CONTRACT.md.
 */
export const Placeholder = ({ title, description }: PlaceholderProps) => (
  <div className="flex flex-col gap-4">
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>Screen not built yet</CardTitle>
        <CardDescription>
          The route, navigation entry and auth guard are wired up. Implement
          this screen next against the endpoint contract in
          admin-ui/API-CONTRACT.md.
        </CardDescription>
      </CardHeader>
    </Card>
  </div>
);
