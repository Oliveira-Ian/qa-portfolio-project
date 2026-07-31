import { Info, Settings, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ComponentDemo, StyleguideSection } from './section-shell';

export function OverlaysSection() {
  return (
    <StyleguideSection id="overlays" title="Overlays">
      <ComponentDemo
        id="overlays-dialog"
        title="Dialog"
        description="Modal, centered — the default for a form or a confirmation."
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customize columns</DialogTitle>
              <DialogDescription>
                Show, hide and reorder the grid&rsquo;s columns.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Restore default</Button>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ComponentDemo>

      <ComponentDemo
        id="overlays-sheet"
        title="Sheet"
        description="Slides in from the edge — a filter drawer, a detail panel."
      >
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Narrow the registry down before exporting it.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </ComponentDemo>

      <ComponentDemo
        id="overlays-drawer"
        title="Drawer"
        description="The mobile-friendly equivalent of a Sheet — a bottom sheet, not a side panel."
      >
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Open drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Export</DrawerTitle>
              <DrawerDescription>Choose a format for the current view.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>CSV</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </ComponentDemo>

      <ComponentDemo id="overlays-popover" title="Popover">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="text-sm text-foreground">Non-modal — the page behind it stays usable.</p>
          </PopoverContent>
        </Popover>
      </ComponentDemo>

      <ComponentDemo
        id="overlays-hover-card"
        title="Hover card"
        description="A record preview without navigating — hover, don&rsquo;t click."
      >
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link" className="px-0">
              Construtora Vale Verde
            </Button>
          </HoverCardTrigger>
          <HoverCardContent>
            <div className="flex items-start gap-2">
              <User className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">Construtora Vale Verde</p>
                <p className="text-xs text-muted-foreground">CLIENT · Active since 2024</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </ComponentDemo>

      <ComponentDemo id="overlays-tooltip" title="Tooltip">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="More information">
                <Info aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Read-only — profiles are edited in Access Control.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ComponentDemo>

      <ComponentDemo id="overlays-dropdown-menu" title="Dropdown menu">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Settings aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ComponentDemo>

      <ComponentDemo
        id="overlays-context-menu"
        title="Context menu"
        description="Right-click the box below."
      >
        <ContextMenu>
          <ContextMenuTrigger className="flex h-24 w-64 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>View</ContextMenuItem>
            <ContextMenuItem>Edit</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </ComponentDemo>

      <ComponentDemo
        id="overlays-command"
        title="Command"
        description="An incremental filter over a list — the building block behind Combobox, MultiSelect and global search."
      >
        <Command className="w-72 rounded-lg border border-border">
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandItem>Client</CommandItem>
            <CommandItem>Supplier</CommandItem>
            <CommandItem>Employee</CommandItem>
          </CommandList>
        </Command>
      </ComponentDemo>
    </StyleguideSection>
  );
}
