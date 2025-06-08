// components/Sidebar.tsx
"use client";

import { Home, Users, FileText, Shirt, Settings, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";

export function Sidebar() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const navItems = [
    { name: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Students", icon: <Users className="h-5 w-5" /> },
    { name: "Invoices", icon: <FileText className="h-5 w-5" /> },
    { name: "Uniforms", icon: <Shirt className="h-5 w-5" /> },
    { name: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  if (isDesktop) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-16 border-r bg-background p-2">
        <div className="flex h-full flex-col items-center gap-1 py-4">
          <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 hover:bg-muted"
                >
                  {item.icon}
                  <span className="sr-only">{item.name}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                {item.name}
              </TooltipContent>
            </Tooltip>
          ))}
          </TooltipProvider>
        </div>
      </aside>
    );
  }

  // Mobile: Bottom bar with icons + names
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-50">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-20">
        <div className="flex h-full items-center justify-around gap-1">
          {navItems.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              size="icon"
              className="flex h-full flex-col items-center gap-1 p-2"
            >
              {item.icon}
              <span className="text-xs">{item.name}</span>
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}