# Innopixel
````
cd C:\Projects\School_Projects\Innopixel\backend\src\Innopixel.Main
dotnet run --launch-profile http
````

````
cd C:\Projects\School_Projects\Innopixel\frontend
npm run dev
````
## Database-migrationer

Kør scripts i `backend/database` i rækkefølge. Efter migration 005 (adgangskoder og nulstillingslinks):

````
psql -h localhost -U innopixel -d innopixel -f backend/database/005_password_management.sql
````

## E-mail (nulstillingslinks og invitationer)

Uden SMTP-opsætning kan der ikke sendes e-mails; platformen siger det selv og tilbyder midlertidige adgangskoder i stedet.
Adgangskoder og nøgler gemmes aldrig i `appsettings.json` – brug user secrets (eller miljøvariabler som `Email__Smtp__Password`):

````
cd backend/src/Innopixel.Main
dotnet user-secrets set "Email:FromAddress" "no-reply@innopixel.dk"
dotnet user-secrets set "Email:Smtp:Host" "smtp.example.com"
dotnet user-secrets set "Email:Smtp:Port" "587"
dotnet user-secrets set "Email:Smtp:Username" "..."
dotnet user-secrets set "Email:Smtp:Password" "..."
dotnet user-secrets set "Email:PublicBaseUrl" "http://localhost:5173"
````

`Email:Smtp:Security` er `StartTls` (port 587, standard), `SslOnConnect` (port 465) eller `None` (kun en lokal testserver).
`PublicBaseUrl` er frontendens adresse; linket i e-mailen peger på `<PublicBaseUrl>/nulstil-adgangskode`.
