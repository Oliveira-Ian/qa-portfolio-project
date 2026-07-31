import { ChevronsUpDown } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ComponentDemo, StyleguideSection } from './section-shell';

export function NavigationDisclosureSection() {
  return (
    <StyleguideSection id="navigation-disclosure" title="Navigation & disclosure">
      <ComponentDemo id="navigation-disclosure-breadcrumb" title="Breadcrumb">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Records</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">People</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Construtora Vale Verde</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ComponentDemo>

      <ComponentDemo
        id="navigation-disclosure-tabs"
        title="Tabs"
        description="Groups a long form into sections without one giant scroll — the Person form uses this for Identification/Contact/Address/Notes."
      >
        <Tabs defaultValue="identification" className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="identification">Identification</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
          </TabsList>
          <TabsContent value="identification" className="mt-3 text-sm text-muted-foreground">
            Name, type, document.
          </TabsContent>
          <TabsContent value="contact" className="mt-3 text-sm text-muted-foreground">
            Email, phone, birthdate.
          </TabsContent>
          <TabsContent value="address" className="mt-3 text-sm text-muted-foreground">
            Street, city, state, zip code.
          </TabsContent>
        </Tabs>
      </ComponentDemo>

      <ComponentDemo id="navigation-disclosure-accordion" title="Accordion">
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full max-w-md">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              What happens when I delete a person with an account?
            </AccordionTrigger>
            <AccordionContent>
              The access account has to be removed first — the record itself is never silently
              cascaded.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Can a person be both a client and a supplier?</AccordionTrigger>
            <AccordionContent>Yes — Type is a multi-select, not a single choice.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </ComponentDemo>

      <ComponentDemo
        id="navigation-disclosure-collapsible"
        title="Collapsible"
        description="One toggleable section, no headless group — the lighter primitive Accordion is built on."
      >
        <Collapsible className="w-full max-w-md">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Advanced filters
              <ChevronsUpDown aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 text-sm text-muted-foreground">
            Created between, updated between, has an access account.
          </CollapsibleContent>
        </Collapsible>
      </ComponentDemo>
    </StyleguideSection>
  );
}
