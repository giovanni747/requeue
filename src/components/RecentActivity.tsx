"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, Package, Ship } from "lucide-react";

type TimelineItem = {
  id: string;
  title: ReactNode;
  description?: string;
  icon?: ReactNode;
  date?: string;
};

interface RecentActivityProps {
  className?: string;
  items?: TimelineItem[];
}

const DefaultIcon = ({ children }: { children: ReactNode }) => (
  <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-2 ring-primary/20">
    {children}
  </div>
);

export function RecentActivity({ className, items }: RecentActivityProps) {
  const data: TimelineItem[] =
    items ?? [
      {
        id: "shipped",
        title: (
          <span className="font-medium">Product Shipped</span>
        ),
        description:
          "We shipped your product via FedEx and it should arrive within 3-5 business days.",
        icon: (
          <DefaultIcon>
            <Ship className="h-4 w-4" />
          </DefaultIcon>
        ),
        date: "May 13, 2021",
      },
      {
        id: "confirmed",
        title: (
          <span className="font-medium">Order Confirmed</span>
        ),
        description: undefined,
        icon: (
          <DefaultIcon>
            <Check className="h-4 w-4" />
          </DefaultIcon>
        ),
        date: "May 18, 2021",
      },
      {
        id: "delivered",
        title: (
          <span className="font-medium">Order Delivered</span>
        ),
        description: "Delivered at 10:30am",
        icon: (
          <DefaultIcon>
            <Package className="h-4 w-4" />
          </DefaultIcon>
        ),
        date: "May 20, 2021",
      },
    ];

  return (
    <Card className={cn("w-full max-w-md p-4", className)}>
      <h3 className="mb-4 text-sm font-semibold tracking-wide text-muted-foreground">
        Recent Activity
      </h3>
      <ol className="relative ml-4 border-l border-border">
        {data.map((item, index) => (
          <li key={item.id} className="mb-6 ml-4">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-2 ring-border">
              {item.icon}
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm leading-none text-foreground">
                  {item.title}
                </div>
                {item.date ? (
                  <time className="text-xs text-muted-foreground">{item.date}</time>
                ) : null}
              </div>
              {item.description ? (
                <p className="text-xs text-muted-foreground">{item.description}</p>
              ) : null}
            </div>
            {index < data.length - 1 ? (
              <Separator className="mt-6" />
            ) : null}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default RecentActivity;


