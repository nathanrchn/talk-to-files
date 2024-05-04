import { ResponseDoc } from "@/lib/types/types";
import { readTextFile } from "@tauri-apps/api/fs";
import { useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ListCollapse, SquarePlus } from "lucide-react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { FilesTable } from "./ui/datatable";

const example = `
L'AVARE




Comédie (1667)



PERSONNAGES                                        ACTEURS

Harpagon, père de Cléante et d'Élise,
et amoureux de Mariane.                            Molière.
Cléante, fils d'Harpagon, amant de Mariane.        La Grange.
Élise, fille d'Harpagon, amante de Valère.         Mlle Molière.
Valère, fils d'Anselme et amant d'Élise.           Du Croisy.
Mariane, amante de Cléante et aimée d'Harpagon.    Mlle De Brie.
Anselme, père de Valère et de Mariane.
Frosine, femme d'intrigue.                         Magd. Béjart.
Maître Simon, courtier.
Maître Jacques, cuisinier et cocher d'Harpagon.    Hubert.
La Flèche, valet de Cléante.                       Béjart cadet.
Dame Claude, servante d'Harpagon.
Brindavoine,
La Merluche, laquais d'Harpagon.
Un commissaire et son clerc.



La scène est à Paris, dans la maison d'Harpagon.


ACTE PREMIER.
-------------


Scène première. - Valère, Élise.



- Valère -

Hé quoi ! charmante Élise, vous devenez mélancolique, après les
obligeantes assurances que vous avez eu la bonté de me donner de votre
foi ? Je vous vois soupirer, hélas ! au milieu de ma joie ! Est-ce du
regret, dites-moi, de m'avoir fait heureux ? et vous repentez-vous de
cet engagement où mes feux ont pu vous contraindre ?


- Élise -

Non, Valère, je ne puis pas me repentir de tout ce que je fais pour
vous. Je m'y sens entraîner par une trop douce puissance, et je n'ai
pas même la force de souhaiter que les choses ne fussent pas. Mais, a
vous dire vrai, le succès me donne de l'inquiétude ; et je crains fort
de vous aimer un peu plus que je ne devrais.


- Valère -

Eh ! que pouvez-vous craindre, Élise, dans les bontés que vous avez
pour moi ?


- Élise -

Hélas ! cent choses à la fois : l'emportement d'un père, les reproches
d'une famille, les censures du monde ; mais plus que tout, Valère, le
changement de votre coeur, et cette froideur criminelle dont ceux de
votre sexe payent le plus souvent les témoignages trop ardents d'un
innocent amour.


- Valère -

Ah ! ne me faites pas ce tort, de juger de moi par les autres !
Soupçonnez-moi de tout, Élise, plutôt que de manquer à ce que je vous
dois. Je vous aime trop pour cela ; et mon amour pour vous durera
autant que ma vie.


- Élise -

Ah ! Valère, chacun tient les mêmes discours ! Tous les hommes sont
semblables par les paroles ; et ce n'est que les actions qui les
découvrent différents.


- Valère -

Puisque les seules actions font connaître ce que nous sommes, attendez
donc, au moins, à juger de mon coeur par elles, et ne me cherchez point
des crimes dans les injustes craintes d'une fâcheuse prévoyance. Ne
m'assassinez point, je vous prie, par les sensibles coups d'un soupçon
outrageux ; et donnez-moi le temps de vous convaincre, par mille et
mille preuves, de l'honnêteté de mes feux.


- Élise -

Hélas ! qu'avec facilité on se laisse persuader par les personnes que
l'on aime ! Oui, Valère, je tiens votre coeur incapable de m'abuser.
Je crois que vous m'aimez d'un véritable amour, et que vous me serez
fidèle : je n'en veux point du tout douter, et je retranche mon
chagrin aux appréhensions du blâme qu'on pourra me donner.


- Valère -

Mais pourquoi cette inquiétude ?


- Élise -

Je n'aurais rien à craindre si tout le monde vous voyait des yeux dont
je vous vois ; et je trouve en votre personne de quoi avoir raison aux
choses que je fais pour vous. Mon coeur, pour sa défense, a tout votre
mérite, appuyé du secours d'une reconnaissance où le ciel m'engage
envers vous. Je me représente à toute heure ce péril étonnant qui
commença de nous offrir aux regards l'un de l'autre ; cette générosité
surprenante qui vous fit risquer votre vie, pour dérober la mienne à la
fureur des ondes ; ces soins pleins de tendresse que vous me fîtes
éclater après m'avoir tirée de l'eau, et les hommages assidus de cet
ardent amour que ni le temps ni les difficultés n'ont rebuté, et qui,
vous faisant négliger et parents et patrie, arrête vos pas en ces
lieux, y tient en ma faveur votre fortune déguisée, et vous a réduit,
pour me voir, à vous revêtir de l'emploi de domestique de mon père.
Tout cela fait chez moi, sans doute, un merveilleux effet ; et c'en est
assez, à mes yeux, pour me justifier l'engagement où j'ai pu consentir ;
mais ce n'est pas assez peut-être pour le justifier aux autres, et je
ne suis pas sûre qu'on entre dans mes sentiments.


- Valère -

De tout ce que vous avez dit, ce n'est que par mon seul amour que je
prétends auprès de vous mériter quelque chose ; et quant aux
scrupules que vous avez, votre père lui-même ne prend que trop de soin
de vous justifier à tout le monde, et l'excès de son avarice, et la
manière austère dont il vit avec ses enfants, pourraient autoriser des
choses plus étranges. Pardonnez-moi, charmante Élise, si j'en parle
ainsi devant vous. Vous savez que, sur ce chapitre, on n'en peut pas
dire de bien. Mais enfin, si je puis, comme je l'espère, retrouver mes
parents, nous n'aurons pas beaucoup de peine à nous les rendre
favorables. J'en attends des nouvelles avec impatience, et j'en irai
chercher moi-même, si elles tardent à venir.


- Élise -

Ah! Valère, ne bougez d'ici, je vous prie, et songez seulement à vous
bien mettre dans l'esprit de mon père.


- Valère -

Vous voyez comme je m'y prends, et les adroites complaisances qu'il
m'a fallu mettre en usage pour m'introduire à son service ; sous quel
masque de sympathie et de rapports de sentiments je me déguise pour
lui plaire, et quel personnage je joue tous les jours avec lui, afin
d'acquérir sa tendresse. J'y fais des progrès admirables ; et j'éprouve
que, pour gagner les hommes, il n'est point de meilleure voie que de se
parer à leurs yeux de leurs inclinations, que de donner dans leurs
maximes, encenser leurs défauts, et applaudir à ce qu'ils font. On n'a
que faire d'avoir peur de trop charger la complaisance ; et la manière
dont on les joue a beau être visible, les plus fins toujours sont de
grandes dupes du côté de la flatterie, et il n'y a rien de si
impertinent et de si ridicule qu'on ne fasse avaler, lorsqu'on
l'assaisonne en louanges. La sincérité souffre un peu au métier que je
fais ; mais, quand on a besoin des hommes, il faut bien s'ajuster à
eux, et puisqu'on ne saurait les gagner que par là, ce n'est pas la
faute de ceux qui flattent, mais de ceux qui veulent être flattés.


- Élise -

Mais que ne tâchez-vous aussi de gagner l'appui de mon frère, en cas
que la servante s'avisât de révéler notre secret ?


- Valère -

On ne peut pas ménager l'un et l'autre ; et l'esprit du père et celui
du fils sont des choses si opposées, qu'il est difficile d'accommoder
ces deux confidences ensemble. Mais vous, de votre part, agissez
auprès de votre frère, et servez-vous de l'amitié qui est entre vous
deux pour le jeter dans nos intérêts. Il vient. Je me retire. Prenez
ce temps pour lui parler, et ne lui découvrez de notre affaire que ce
que vous jugerez à propos.


- Élise -

Je ne sais si j'aurai la force de lui faire cette confidence.


-----------

Scène II. - Cléante, Élise.



- Cléante -

Je suis bien aise de vous trouver seule, ma soeur ; et je brûlais de
vous parler, pour m'ouvrir à vous d'un secret.


- Élise -

Me voilà prête à vous ouïr, mon frère. Qu'avez-vous à me dire ?


- Cléante -

Bien des choses, ma soeur, enveloppées dans un mot. J'aime.


- Élise -

Vous aimez ?


- Cléante -

Oui, j'aime. Mais, avant que d'aller plus loin, je sais que je dépends
d'un père, et que le nom de fils me soumet à ses volontés ; que nous
ne devons point engager notre foi sans le consentement de ceux dont
nous tenons le jour ; que le ciel les a faits les maîtres de nos
voeux, et qu'il nous est enjoint de n'en disposer que par leur
conduite ; que, n'étant prévenus d'aucune folle ardeur, ils sont en
état de se tromper bien moins que nous et de voir beaucoup mieux ce
qui nous est propre ; qu'il en faut plutôt croire les lumières de leur
prudence que l'aveuglement de notre passion ; et que l'emportement de
la jeunesse nous entraîne le plus souvent dans des précipices
fâcheux. Je vous dis tout cela, ma soeur, afin que vous ne vous
donniez pas la peine de me le dire ? car enfin mon amour ne veut rien
écouter, et je vous prie de ne me point faire de remontrances.
`;

export default function FilesScreen(
  { DB, reloadDB }: { DB: string[]; reloadDB: () => void },
) {
  const [text, setText] = useState("");

  const readFileContents = async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        title: "Open Text File",
        filters: [{
          name: "Text",
          extensions: ["txt"],
        }],
      });
      if (!selectedPath) return;
      const data = await readTextFile(selectedPath as string);
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  };

  const splitStringIntoWordChunks = (str: string, chunkSize: number): string[] => {
    const cleanedStr = str.trim().replace(/\s+/g, ' '); // remove extra whitespace
    const words = cleanedStr.split(' '); // split string into words
    const chunks = Array.from({ length: Math.ceil(words.length / chunkSize) }, (_, i) => {
      const start = i * chunkSize;
      return words.slice(start, start + chunkSize);
    });
    return chunks.map((chunk) => chunk.join(' '));
  }

  const textEmbedding = async () => {
    const chunkSize = 256;

    await invoke("generate_embeddings", {
      sentences: splitStringIntoWordChunks(text, chunkSize),
    });

    reloadDB();
  };

  return (
    <div className="w-screen h-full px-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="resize-none w-full min-h-[300px]"
        placeholder="Enter some text that will be used to create you database"
      />
      <div className="flex flex-row w-full justify-center space-x-4 my-4">
        <Button variant="secondary" className="w-full" onClick={textEmbedding}>
          <SquarePlus className="h-4 w-4 mr-2 text-muted-foreground" />
          <p className="text-muted-foreground">Add to the database</p>
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setText(example.replaceAll("\n", ""));
          }}
        >
          <ListCollapse className="h-4 w-4 mr-2 text-muted-foreground" />
          <p className="text-muted-foreground">
            Add an example (Molière extract)
          </p>
        </Button>
      </div>
      <FilesTable DB={DB.slice(0, 10)} />
    </div>
  );
}
