"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Files, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Badge } from "@/components/ui/badge";
import SearchScreen from "@/components/search-screen";
import FilesScreen from "@/components/file-screen";
import { DocFromDb } from "@/lib/types/types";

export default function Page() {
  const [DB, setDB] = useState<DocFromDb[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const reloadDB = () => {
    invoke("get_db").then((res: any) => {
      if (res) {
        setDB(res);
      }
    }).catch(() => {
      // we are with an empty vec
      setDB([]);
    });
  }

  const createAppDataDir = async () => {
    await invoke("is_db_created");
    reloadDB();
    setLoading(false);
  }

  useEffect(() => {
    createAppDataDir();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen justify-center items-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <div className="">
      <Badge variant="secondary" className="absolute right-4 top-6">
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
    </div>
  );
}
