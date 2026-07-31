interface NavGroup {
  id: string;
  label: string;
  items: string[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'foundations',
    label: 'Foundations',
    items: ['Colors', 'Typography', 'Field sizing', 'Spacing & radius'],
  },
  {
    id: 'buttons-actions',
    label: 'Buttons & actions',
    items: ['Button', 'Toggle', 'Toggle group'],
  },
  {
    id: 'form-controls',
    label: 'Form controls',
    items: [
      'Input',
      'Textarea',
      'Checkbox',
      'Radio group',
      'Switch',
      'Slider',
      'Combobox',
      'Select',
      'Multi-select',
      'Masked input',
      'Number input',
      'Currency input',
      'Time input',
      'Date picker',
      'Date range picker',
      'File upload',
      'Image input',
    ],
  },
  {
    id: 'feedback-status',
    label: 'Feedback & status',
    items: [
      'Alert',
      'Alert dialog',
      'Badge',
      'Progress',
      'Skeleton',
      'Empty state',
      'Loading state',
      'Toast',
    ],
  },
  {
    id: 'overlays',
    label: 'Overlays',
    items: [
      'Dialog',
      'Sheet',
      'Drawer',
      'Popover',
      'Hover card',
      'Tooltip',
      'Dropdown menu',
      'Context menu',
      'Command',
    ],
  },
  {
    id: 'navigation-disclosure',
    label: 'Navigation & disclosure',
    items: ['Breadcrumb', 'Tabs', 'Accordion', 'Collapsible'],
  },
  {
    id: 'layout-structure',
    label: 'Layout & structure',
    items: ['Card', 'Separator', 'Avatar', 'Scroll area'],
  },
  {
    id: 'data-display',
    label: 'Data display',
    items: [
      'Table',
      'Chart',
      'Calendar',
      'Carousel',
      'Stepper',
      'Timeline',
      'Stat card',
      'Description list',
    ],
  },
];

function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/**
 * A plain anchor list, no client JS — `:target`'s `scroll-margin-top` (set
 * globally in `globals.css`) already keeps an anchored heading clear of the
 * fixed header, so there's no scroll-spy machinery to keep in sync here.
 */
export function StyleguideNav() {
  return (
    <nav aria-label="Component catalog" className="text-sm">
      <ul className="flex flex-col gap-6">
        {NAV_GROUPS.map((group) => (
          <li key={group.id}>
            <a href={`#${group.id}`} className="font-medium text-foreground hover:text-primary">
              {group.label}
            </a>
            <ul className="mt-2 flex flex-col gap-1.5 border-l border-border pl-3">
              {group.items.map((item) => (
                <li key={item}>
                  <a
                    href={`#${group.id}-${slugify(item)}`}
                    className="text-muted-foreground hover:text-primary"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
