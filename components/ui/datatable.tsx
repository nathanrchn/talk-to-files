import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export function FilesTable({ DB }: { DB: string[] }) {
  return (
    <>
      <h2 className="text-muted-foreground font-extrabold text-lg pt-4">Your files</h2>
      <Table>
        <TableCaption>A list of some of your files.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="">N°</TableHead>
            <TableHead className="w-full">Invoice</TableHead>
            <TableHead className=""></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DB.map((file, index) => (
            <TableRow key={index}>
              <TableCell className="font-sm text-muted-foreground">
                {index}
              </TableCell>
              <TableCell className="font-sm text-muted-foreground">
                {file}
              </TableCell>
              <TableCell>
                ...
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
