import { DocFromDb, ResponseDoc } from "@/lib/types/types";
import { readTextFile } from "@tauri-apps/api/fs";
import { useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ListCollapse, Loader2, SquarePlus } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { FilesTable } from "./ui/datatable";
import { useToast } from "./ui/use-toast";

export default function FilesScreen(
    { DB, reloadDB }: { DB: DocFromDb[]; reloadDB: () => void },
) {
    const [uploadedDocuments, setUploadedDocuments] = useState<DocFromDb[]>([]);
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
          setUploadedDocuments(documents);
        } catch (err) {
          console.error(err);
        }
    };

    const splitDocumentsIntoWordChunks = (
        documents: {path: string, content: string}[],
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

    const createEmbeddings = async () => {
        setLoading(true);

        const chunkSize = 256;
        const chunks = splitDocumentsIntoWordChunks(uploadedDocuments, chunkSize);

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

    return (
        <div className="w-screen h-full px-4">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="resize-none w-full min-h-[300px]"
                placeholder="Enter some text that will be used to create you database"
            />
            <div className="flex flex-row w-full justify-center space-x-4 my-4">
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
                    variant="secondary"
                    className="w-full"
                    onClick={createEmbeddings}
                    disabled={loading}
                >
                    {loading
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <SquarePlus className="h-4 w-4 mr-2 text-muted-foreground" />}
                    <p className="text-muted-foreground">Upload to the DB</p>
                </Button>                
            </div>
            add files
            remove files
            reload whole db
            delete whole db
            see file in finder
            <FilesTable DB={DB.slice(0, 10)} />
        </div>
    );
}
