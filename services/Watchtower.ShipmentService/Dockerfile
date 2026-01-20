FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Watchtower.ShipmentService.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y libfontconfig1 libfreetype6 libharfbuzz0b libgdiplus libc6-dev && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
EXPOSE 5001
ENTRYPOINT ["dotnet", "Watchtower.ShipmentService.dll"]
