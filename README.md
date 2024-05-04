# Talk To Files (nom à revoir)

## How to run
```
npm i
npm run tauri dev
```

## File structure
```
├── app
│   ├── layout.tsx (fichier nextjs qui englobe page.tsx)
│   └── page.tsx (page de rendu nextjs dans l'app)
├── components
│   └── xxx.tsx (components nextjs)
├── lib
│   ├── types
│   │   └── types.ts (types nextjs)
│   └── utils.ts 
├── public
│   └── xxx.svg (icones nextjs)
├── src-tauri (dossier tauri en rust)
│   ├── icons
│   │   └── xxx.png (icones tauri)
│   ├── model (pour l'instant les fichiers de l'embedder)
│   │   ├── config.json
│   │   ├── model.safetensors
│   │   └── tokenizer.json
│   ├── src (dossier contenant nos fichiers rust)
│   │   ├── main.rs (fichier qui contient les fonctions appelées depuis le front)
│   │   └── model.rs (fichier qui gère le chargement du modèle d'embedding)
│   └── Cargo.toml (fichier qui gère les librairies rust)
```

Manual installation for libtorch on mac os 
```
brew install pytorch jq
export LIBTORCH=$(brew --cellar pytorch)/$(brew info --json pytorch | jq -r '.[0].installed[0].version')
export LD_LIBRARY_PATH=${LIBTORCH}/lib:$LD_LIBRARY_PATH
```
