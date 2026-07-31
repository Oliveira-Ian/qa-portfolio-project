import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ComponentDemo, StyleguideSection } from './section-shell';

const STATES = Array.from({ length: 12 }, (_, index) => `Item ${index + 1}`);

export function LayoutStructureSection() {
  return (
    <StyleguideSection id="layout-structure" title="Layout & structure">
      <ComponentDemo id="layout-structure-card" title="Card">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Access account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">admin@oliveira.local · ADMIN · Active</p>
            <Button size="sm" className="w-fit">
              Manage
            </Button>
          </CardContent>
        </Card>
      </ComponentDemo>

      <ComponentDemo id="layout-structure-separator" title="Separator">
        <div className="max-w-xs">
          <p className="text-sm text-foreground">Above</p>
          <Separator className="my-3" />
          <p className="text-sm text-foreground">Below</p>
        </div>
      </ComponentDemo>

      <ComponentDemo id="layout-structure-avatar" title="Avatar">
        <div className="flex flex-wrap items-center gap-6">
          <Avatar>
            <AvatarFallback>IA</AvatarFallback>
          </Avatar>
          <AvatarGroup>
            <Avatar>
              <AvatarFallback>IA</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>SY</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="layout-structure-scroll-area"
        title="Scroll area"
        description="A consistent scrollbar across browsers/OSes — used for a long list inside a Popover or Dialog."
      >
        <ScrollArea className="h-40 w-64 rounded-md border border-border">
          <div className="flex flex-col gap-2 p-3">
            {STATES.map((item) => (
              <p key={item} className="text-sm text-foreground">
                {item}
              </p>
            ))}
          </div>
        </ScrollArea>
      </ComponentDemo>
    </StyleguideSection>
  );
}
