import { ResponseDoc } from "@/lib/types/types";
import { invoke } from "@tauri-apps/api/tauri";
import { FormEvent, useState } from "react";
import { Switch } from "./ui/switch";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

export default function SearchScreen({ DB }: { DB: string[] }) {
    const [useLLM, setUseLLM] = useState<boolean>(true);
    const [inputContent, setInputContent] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<ResponseDoc[]>([]);
  
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      console.log("handleSubmit started");
      if (DB.length < 3) {
        alert("You need to have at least 3 chunks in the DB before querying.");
      } else {
        console.log("Before invoke");
        const res: string[] = await invoke("query_db", {
          text: inputContent,
          numResults: 3,
        });
        console.log("After invoke", res);
  
        var formattedDocuments: ResponseDoc[] = [];
  
        for (let i = 0; i < res.length; i++) {
          const current = res[i].split(/\|/, 3);
          formattedDocuments.push({
            index: current[0],
            score: current[1],
            content: current[2],
          });
        }
  
        setResults(formattedDocuments);
      }
      console.log("handleSubmit ended");
    };
  
    return (
      <div className="w-screen h-full flex flex-col px-4 justify-center items-center space-y-4">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            console.log("ok !");
            setLoading(true);
            try {
              await handleSubmit(event);
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
            <Card key={result.index}>
              <CardContent className="p-3 flex flex-row items-center space-x-3">
                {/* <p className="text-sm">{result.content}</p> */}
                <Popover>
                  <PopoverTrigger>
                    <Badge variant="secondary">
                      <p className="text-sm text-muted-foreground">
                        {/* {Number(result.score).toFixed(2)} */}
                        Document {result.index}
                      </p>
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent>
                    <p className="font-bold text-muted-foreground">
                      Document {result.index} ---{" "}
                      {Number(result.score).toFixed(2)} acc
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {result.content}
                    </p>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }