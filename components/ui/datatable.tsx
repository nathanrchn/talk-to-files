import { DocFromDb } from "@/lib/types/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./dropdown-menu";
import { Ellipsis } from "lucide-react";
import { Button } from "./button";
import { invoke } from "@tauri-apps/api/tauri";

export function FilesTable({ DB }: { DB: DocFromDb[] }) {
  return (
    <>
      <h2 className="text-muted-foreground font-extrabold text-lg pt-4">Your chunks</h2>
      <Table>
        <TableCaption>A list of some of your files.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="">N°</TableHead>
            <TableHead className="">File</TableHead>
            <TableHead className="w-full">Content</TableHead>
            <TableHead className=""></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DB.map((file, index) => (
            <TableRow key={index}>
              <TableCell className="font-sm text-muted-foreground">
                {index}
              </TableCell>
              <TableCell className="font-sm text-muted-foreground">{file.path.split("/")[file.path.split("/").length - 1]}</TableCell>
              <TableCell className="font-sm text-muted-foreground">
                {file.content}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button className="p-0" variant="ghost">
                    <Ellipsis className="w-4 h-4 text-muted-foreground" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(file.content)}
            >
              Copy chunk content
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(file.path)}
            >
              Copy file path
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async() => await invoke("open_finder", {path: file.path})}
            >
              See file in Finder
            </DropdownMenuItem>
          </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
