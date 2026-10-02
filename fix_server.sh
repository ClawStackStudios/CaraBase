sed -i 's/<<<<<<< HEAD//' server.ts
sed -i 's/      let def = `${name} ${c.type || '\''TEXT'\''}`;//' server.ts
sed -i 's/=======//' server.ts
sed -i 's/>>>>>>> origin\/sentinel-sql-injection-fix-3554386532551633892//' server.ts
