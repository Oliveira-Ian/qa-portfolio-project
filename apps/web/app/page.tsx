import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col gap-8 p-12" data-testid="styleguide-page">
      <h1 className="text-2xl font-bold text-foreground">Oliveira ERP — Design System Preview</h1>

      <Card className="max-w-md rounded-lg shadow-card" data-testid="styleguide-card">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="rounded-md shadow-input"
              data-testid="styleguide-input-email"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox id="remember" data-testid="styleguide-checkbox-remember" />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">
                Remember me
              </Label>
            </div>
          </div>

          <Button
            className="rounded-md bg-primary text-primary-foreground shadow-button hover:bg-primary-hover"
            data-testid="styleguide-button-submit"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </div>

      <div className="flex gap-3">
        <span className="rounded-md bg-toast-success px-3 py-1 text-sm text-white">success</span>
        <span className="rounded-md bg-toast-error px-3 py-1 text-sm text-white">error</span>
        <span className="rounded-md bg-toast-warning px-3 py-1 text-sm text-white">warning</span>
        <span className="rounded-md bg-toast-info px-3 py-1 text-sm text-white">info</span>
      </div>
    </main>
  );
}
