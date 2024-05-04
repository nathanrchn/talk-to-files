"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Files, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Badge } from "@/components/ui/badge";
import SearchScreen from "@/components/search-screen";
import FilesScreen from "@/components/file-screen";
import { ResponseDoc } from "@/lib/types/types";

export default function Page() {
  const { setTheme } = useTheme();
  const [DB, setDB] = useState<string[]>([]);

  const reloadDB = () => {
    invoke("get_db").then((res: any) => {
      setDB(res);
    });
  }

  useEffect(() => {   
    reloadDB();
    // const checkIfCreated = async () => {
    //   try {
    //     const created = await exists("text_map.bin", {
    //       dir: BaseDirectory.AppData,
    //     });
    //     if (!created) {
    //       await createDir(await appDataDir());
    //     } else {
    //     }
    //   } catch (error) {
    //     console.log("failed loadig file", error);
    //   }
    // };
    // checkIfCreated();
  }, []);

  return (
    <div className="">
      <Badge variant="secondary" className="absolute left-4 top-6">
        <p className="text-sm text-muted-foreground">
          {DB.length} chunks loaded
        </p>
      </Badge>
      <Tabs
        defaultValue="search"
        className="parent w-screen h-dvh flex flex-col items-center py-4 space-y-4"
      >
        <TabsList className="relative">
          <TabsTrigger value="search" className="px-8">
            <Search className="w-4 h-4 mr-2" />Search
          </TabsTrigger>
          <TabsTrigger value="files" className="px-8">
            <Files className="w-4 h-4 mr-2" />Files
          </TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="h-full">
          <SearchScreen DB={DB} />
        </TabsContent>
        <TabsContent value="files" className="h-full">
          <FilesScreen DB={DB} reloadDB={reloadDB} />
        </TabsContent>
      </Tabs>
      <div className="absolute right-4 top-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
