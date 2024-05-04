import { DocFromDb, ResponseDoc } from "@/lib/types/types";
import { invoke } from "@tauri-apps/api/tauri";
import { useState } from "react";
import { Switch } from "./ui/switch";
import { Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function SearchScreen({ DB }: { DB: DocFromDb[] }) {
    const [useLLM, setUseLLM] = useState<boolean>(true);
    const [inputContent, setInputContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<ResponseDoc[]>([]);

    const handleSubmit = async () => {
        if (DB.length < 3) {
            alert("You need to have at least 3 chunks in the DB before querying.");
        } else {
            const res: string[] = await invoke("query_db", {
                text: inputContent,
                numResults: 3,
            });

            var formattedDocuments: ResponseDoc[] = [];

            for (let i = 0; i < res.length; i++) {
                const current = res[i].split(/\|/, 4);
                formattedDocuments.push({
                    index: current[0],
                    score: current[1],
                    path: current[2],
                    content: current[3],
                });
            }

            setResults(formattedDocuments);
        }
    };

    return (
        <div className="w-screen h-full flex flex-col px-4 justify-center items-center space-y-4">
            <form
                onSubmit={async (event) => {
                    event.preventDefault();
                    setLoading(true);
                    try {
                        await handleSubmit();
                    } finally {
                        setLoading(false);
                    }
                }}
                className="max-w-[500px] w-full"
            >
                <Input
                    placeholder="Enter your query here..."
                    type="search"
                    autoComplete="off"
                    aria-autocomplete="none"
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    disabled={loading}
                />
            </form>
            <div className="flex flex-row space-x-4">
                <p className="text-sm text-muted-foreground">
                    Use LLM for answering
                </p>
                <Switch />
            </div>
            {loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <div className="flex flex-row space-x-3">
                {!loading && results.map((result) => (
                    <TooltipProvider key={result.index}>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="secondary" className="pointer-events-none">
                                    <p className="text-sm text-muted-foreground">
                                        {result.path.split("/")[result.path.split("/").length - 1]}
                                    </p>
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>

                                <p className="font-bold text-muted-foreground">
                                    {result.path.split("/")[result.path.split("/").length - 1]} --- {Number(result.score).toFixed(2)} acc
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {result.content}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>
        </div>
    );
}