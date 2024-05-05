"use client";

import { DocFromDb, ResponseDoc } from "@/lib/types/types";
import { readTextFile } from "@tauri-apps/api/fs";
import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { FileMinus, ListCollapse, Loader2, RefreshCcw, SquarePlus, Trash2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { FilesTable } from "./ui/datatable";
import { useToast } from "./ui/use-toast";

export default function FilesScreen(
    { DB, reloadDB }: { DB: DocFromDb[]; reloadDB: () => void },
) {    
    const [text, setText] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const { toast } = useToast();

    const readFileContents = async () => {
        try {
          const selectedPaths = await open({
            multiple: true,
            title: "Open Text File",
            filters: [{
              name: "Text",
              extensions: ["txt"],
            }],
          });
          if (!selectedPaths) return;
          var documents: DocFromDb[] = [];
          for (let i = 0; i < selectedPaths.length; i++) {
              const data = await readTextFile(selectedPaths[i] as string);                         
              documents.push({content: data, path: selectedPaths[i] as string});
          }
          createEmbeddings(documents);        
        } catch (err) {
          console.error(err);
        }
    };

    const splitDocumentsIntoWordChunks = (
        documents: DocFromDb[],
        chunkSize: number,
    ): {content: string, path: string}[] => {
        let chunks: {content: string, path: string}[] = [];
    
        for (const doc of documents) {
            const cleanedStr = doc.content.trim().replace(/\s+/g, " "); // remove extra whitespace
            const words = cleanedStr.split(" "); // split string into words
    
            const docChunks = Array.from(
                { length: Math.ceil(words.length / chunkSize) },
                (_, i) => {
                    const start = i * chunkSize;
                    return words.slice(start, start + chunkSize);
                },
            );
    
            docChunks.forEach((chunk) => {
                chunks.push({
                    content: chunk.join(" "),
                    path: doc.path,
                });
            });
        }
    
        return chunks;
    };

    const createEmbeddings = async (documents: DocFromDb[]) => {
        setLoading(true);

        const chunkSize = 256;
        const chunks = splitDocumentsIntoWordChunks(documents, chunkSize);

        toast({
            title: "Started embedding your files...",
            description: `Your documents will be splited in ${chunks.length} chunks.`,
          });
      
          await invoke("generate_embeddings", {
            textInfos: chunks,
          });
      
          reloadDB();
          setLoading(false);
          toast({
            title: "Embeddings done !",
            description:
              `Your documents are now embedded, the database has been reloaded.`,
          });
    }

    const notImlementedYet = () => {
        return alert("Not implemented now...")
    }

    return (
        <div className="w-screen h-full px-4">
            <h2 className="text-muted-foreground font-extrabold text-lg pt-4">Your files</h2>
            <p className="text-muted-foreground text-sm mb-4">You can select .txt files and put them to the app, all your files will stay on your computer, nothing will be uploaded to the cloud.<br /><b>Your files, your space : store locally, access freely :)</b></p>
            <div className="flex flex-row w-full justify-center space-x-4 max-w-[800px] mx-auto">
                <Button
                    variant="secondary"
                    className="w-full"
                    // onClick={textEmbedding}
                    onClick={readFileContents}
                    disabled={loading}
                >
                    {loading
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <SquarePlus className="h-4 w-4 mr-2 text-muted-foreground" />}
                    <p className="text-muted-foreground">Add files</p>
                </Button>
                <Button
                    variant="outline"                    
                    onClick={notImlementedYet}
                    disabled={loading}
                >
                    {loading
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <FileMinus className="h-4 w-4 mr-2 text-muted-foreground" />}
                        <p className="text-muted-foreground">Remove files</p>                 
                </Button>
                <Button
                    variant="outline"                    
                    onClick={async () => {
                        await invoke("delete_db");
                        reloadDB();

                        toast({
                            title: "DB deleted !",
                            description:
                              `Your DB got successfully deleted`,
                          });
                    }}
                    disabled={loading}
                >
                    {loading
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <Trash2 className="h-4 w-4 mr-2 text-muted-foreground" />}
                        <p className="text-muted-foreground">Delete db</p>                    
                </Button>           
            </div>
            <FilesTable DB={DB.slice(0, 10)} />
        </div>
    );
}
